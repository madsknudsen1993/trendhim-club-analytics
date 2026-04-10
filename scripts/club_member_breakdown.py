#!/usr/bin/env python3
"""
Club Member Breakdown Analysis

What purchase behavior do ALL Club members have?
Why do only ~9,000 qualify for Best/Medium segments?

Total Club Members: 201,477
Best: 4,589 (2.3%)
Medium: 4,664 (2.3%)
Remaining: 192,224 (95.4%) - WHO ARE THESE?
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")


def load_data():
    """Load order history and Club members."""
    print("Loading Order History...")
    csv_files = list(ORDER_HISTORY_PATH.glob("*.csv"))

    dfs = []
    for f in csv_files:
        df = pd.read_csv(f, low_memory=False)
        dfs.append(df)

    orders = pd.concat(dfs, ignore_index=True)
    orders.columns = orders.columns.str.strip()
    orders['COMPLETED_AT_DATE'] = pd.to_datetime(orders['COMPLETED_AT_DATE'])
    orders = orders.drop_duplicates(subset=['ORDER_NUMBER'])

    for col in ['GROSS_AMOUNT_DKK', 'PROFIT_TRACKING_TOTAL_PROFIT_DKK']:
        orders[col] = pd.to_numeric(orders[col], errors='coerce').fillna(0)

    orders = orders[
        (orders['ORDER_STATE'] == 'Complete') &
        (orders['IS_INTERNAL_ORDER'] == False) &
        (orders['IS_ORDER_RESEND'] == False) &
        (orders['IS_AN_ORDER_EXCHANGE'] == False)
    ].copy()

    print(f"Valid orders: {len(orders):,}")

    # Get Club orders
    print("\nGetting Club orders from database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT DISTINCT order_number
        FROM "order"
        WHERE customer_group_key = 'club' AND created_at >= '2025-04-01'
    """)
    club_order_numbers = set(row['order_number'] for row in cursor.fetchall())
    cursor.close()
    conn.close()

    orders['is_club_order'] = orders['ORDER_NUMBER'].isin(club_order_numbers)

    return orders, club_order_numbers


def analyze_club_members(orders, club_order_numbers):
    """Analyze ALL Club members and categorize them."""

    # Split by period
    before_df = orders[orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = orders[orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Identify all Club members
    club_members = set(after_df[after_df['is_club_order']]['UNIQUE_CUSTOMER_ID'].unique())
    print(f"\n{'='*80}")
    print(f"TOTAL CLUB MEMBERS: {len(club_members):,}")
    print(f"{'='*80}")

    # Calculate stats for each Club member
    def get_period_stats(df, customer_ids):
        """Get order stats for customers in a period."""
        subset = df[df['UNIQUE_CUSTOMER_ID'].isin(customer_ids)]
        stats = subset.groupby('UNIQUE_CUSTOMER_ID').agg({
            'ORDER_NUMBER': 'count',
            'COMPLETED_AT_DATE': ['min', 'max'],
            'GROSS_AMOUNT_DKK': 'mean',
            'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean',
        })
        stats.columns = ['orders', 'first_order', 'last_order', 'avg_aov', 'avg_profit']
        stats['days_span'] = (stats['last_order'] - stats['first_order']).dt.days
        return stats

    before_stats = get_period_stats(before_df, club_members)
    after_stats = get_period_stats(after_df, club_members)

    # Categorize each Club member
    categories = {
        'best': [],
        'medium': [],
        'new_active': [],      # No orders before, 2+ orders after
        'new_single': [],      # No orders before, only 1 order after
        'lapsed_returned': [], # 1+ orders before, only 1 order after
        'inactive': [],        # Joined but no qualifying orders yet
    }

    for customer_id in club_members:
        before = before_stats.loc[customer_id] if customer_id in before_stats.index else None
        after = after_stats.loc[customer_id] if customer_id in after_stats.index else None

        has_before = before is not None
        before_orders = before['orders'] if has_before else 0
        before_days = before['days_span'] if has_before else 0

        has_after = after is not None
        after_orders = after['orders'] if has_after else 0
        after_days = after['days_span'] if has_after else 0

        # Best: 2+ orders AND 60+ days in BOTH periods
        if before_orders >= 2 and before_days >= 60 and after_orders >= 2 and after_days >= 60:
            categories['best'].append(customer_id)
        # Medium: 1+ before, 2+ orders AND 60+ days after (excluding Best)
        elif before_orders >= 1 and after_orders >= 2 and after_days >= 60:
            categories['medium'].append(customer_id)
        # New Active: No orders before, 2+ orders after with 60+ days
        elif before_orders == 0 and after_orders >= 2 and after_days >= 60:
            categories['new_active'].append(customer_id)
        # New Single: No orders before, only 1 order after
        elif before_orders == 0 and after_orders == 1:
            categories['new_single'].append(customer_id)
        # Lapsed Returned: Had orders before, but only 1 order after
        elif before_orders >= 1 and after_orders == 1:
            categories['lapsed_returned'].append(customer_id)
        # Inactive or short span
        else:
            categories['inactive'].append(customer_id)

    # Print breakdown
    print(f"\n{'='*80}")
    print("CLUB MEMBER BREAKDOWN BY PURCHASE BEHAVIOR")
    print(f"{'='*80}")

    total = len(club_members)
    for cat, members in categories.items():
        pct = len(members) / total * 100
        print(f"\n{cat.upper().replace('_', ' ')}: {len(members):,} ({pct:.1f}%)")

        if len(members) > 0:
            # Get their after-period stats
            cat_after = after_stats[after_stats.index.isin(members)]
            if len(cat_after) > 0:
                print(f"  Avg orders (after): {cat_after['orders'].mean():.2f}")
                print(f"  Avg AOV: {cat_after['avg_aov'].mean():.0f} DKK")
                print(f"  Avg profit/order: {cat_after['avg_profit'].mean():.0f} DKK")
                print(f"  Avg days span: {cat_after['days_span'].mean():.0f} days")

    # Detailed analysis of "new single" - the biggest group likely
    print(f"\n{'='*80}")
    print("DEEP DIVE: NEW SINGLE-ORDER CLUB MEMBERS")
    print(f"{'='*80}")

    new_single_ids = set(categories['new_single'])
    new_single_orders = after_df[after_df['UNIQUE_CUSTOMER_ID'].isin(new_single_ids)]

    if len(new_single_orders) > 0:
        print(f"Total members: {len(new_single_ids):,}")
        print(f"Total orders: {len(new_single_orders):,}")
        print(f"Avg AOV: {new_single_orders['GROSS_AMOUNT_DKK'].mean():.0f} DKK")
        print(f"Avg profit/order: {new_single_orders['PROFIT_TRACKING_TOTAL_PROFIT_DKK'].mean():.0f} DKK")

        # When did they join?
        new_single_orders['month'] = new_single_orders['COMPLETED_AT_DATE'].dt.to_period('M')
        by_month = new_single_orders.groupby('month').size()
        print(f"\nOrders by month:")
        for month, count in by_month.items():
            print(f"  {month}: {count:,}")

    # Summary table
    print(f"\n{'='*80}")
    print("SUMMARY: WHERE ARE THE 201K CLUB MEMBERS?")
    print(f"{'='*80}")
    print(f"""
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Category              │ Count      │ % of Club │ Description                    │
├───────────────────────┼────────────┼───────────┼────────────────────────────────┤
│ BEST                  │ {len(categories['best']):>10,} │ {len(categories['best'])/total*100:>7.1f}%  │ 2+ orders, 60+ days BOTH      │
│ MEDIUM                │ {len(categories['medium']):>10,} │ {len(categories['medium'])/total*100:>7.1f}%  │ 1+ before, 2+/60d after       │
├───────────────────────┼────────────┼───────────┼────────────────────────────────┤
│ NEW ACTIVE            │ {len(categories['new_active']):>10,} │ {len(categories['new_active'])/total*100:>7.1f}%  │ No before, 2+/60d after       │
│ NEW SINGLE            │ {len(categories['new_single']):>10,} │ {len(categories['new_single'])/total*100:>7.1f}%  │ No before, only 1 order       │
│ LAPSED RETURNED       │ {len(categories['lapsed_returned']):>10,} │ {len(categories['lapsed_returned'])/total*100:>7.1f}%  │ Had before, only 1 after      │
│ INACTIVE/SHORT SPAN   │ {len(categories['inactive']):>10,} │ {len(categories['inactive'])/total*100:>7.1f}%  │ Other (short span, etc)       │
├───────────────────────┼────────────┼───────────┼────────────────────────────────┤
│ TOTAL                 │ {total:>10,} │  100.0%   │                                │
└─────────────────────────────────────────────────────────────────────────────────┘

KEY INSIGHT:
The "positive" Best + Medium segments only cover {len(categories['best']) + len(categories['medium']):,} members ({(len(categories['best']) + len(categories['medium']))/total*100:.1f}%).

The majority of Club members are likely:
• NEW SINGLE: Signed up for Club, placed 1 order, haven't returned yet
• NEW ACTIVE: New to brand, became active Club members
• LAPSED RETURNED: Old customers who came back but only once

These categories need separate P&L analysis!
""")

    return categories


def main():
    orders, club_order_numbers = load_data()
    categories = analyze_club_members(orders, club_order_numbers)


if __name__ == "__main__":
    main()
