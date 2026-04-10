#!/usr/bin/env python3
"""
Club Member Breakdown - CONSERVATIVE Definition

Using the correct definition:
- Verified Club Members: Customers in cashback file (57,968)
- Club Orders: Orders placed AFTER their club join date (75,272)

NOT the simple approach (customerGroup.key = 'club' = 201,477 members)
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
    """Load order history and get verified Club members from cashback."""
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

    # Get VERIFIED Club members from cashback table
    # This is the Conservative definition - customers who actually have cashback records
    print("\nGetting VERIFIED Club members from cashback table...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Get all customers with cashback records and their first cashback date (join date)
    cursor.execute("""
        SELECT
            customer_id,
            MIN(recorded_at) as join_date
        FROM customer_cashback
        GROUP BY customer_id
    """)
    cashback_customers = {row['customer_id']: row['join_date'] for row in cursor.fetchall()}

    cursor.close()
    conn.close()

    print(f"Verified Club Members (from cashback): {len(cashback_customers):,}")

    return orders, cashback_customers


def analyze_club_members(orders, cashback_customers):
    """Analyze ALL verified Club members."""

    # Map customer IDs - need to find the link between cashback customer_id and order UNIQUE_CUSTOMER_ID
    # First, let's check if we can match them

    # Get unique customer IDs from orders
    order_customer_ids = set(orders['UNIQUE_CUSTOMER_ID'].unique())
    cashback_ids = set(cashback_customers.keys())

    # Find overlap
    matched_customers = order_customer_ids & cashback_ids
    print(f"\nCustomer ID matching:")
    print(f"  Order customer IDs: {len(order_customer_ids):,}")
    print(f"  Cashback customer IDs: {len(cashback_ids):,}")
    print(f"  Matched: {len(matched_customers):,}")

    if len(matched_customers) == 0:
        print("\nNo direct match - trying to match via order_number...")

        # Get order numbers from cashback and match to orders
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT DISTINCT
                cc.customer_id as cashback_customer_id,
                cc.order_number,
                MIN(cc.recorded_at) OVER (PARTITION BY cc.customer_id) as join_date
            FROM customer_cashback cc
            WHERE cc.order_number IS NOT NULL
        """)
        cashback_orders = pd.DataFrame(cursor.fetchall())
        cursor.close()
        conn.close()

        if len(cashback_orders) > 0:
            # Merge with orders to get UNIQUE_CUSTOMER_ID
            merged = orders.merge(
                cashback_orders,
                left_on='ORDER_NUMBER',
                right_on='order_number',
                how='inner'
            )

            # Build mapping from cashback_customer_id to UNIQUE_CUSTOMER_ID
            customer_mapping = merged.groupby('cashback_customer_id')['UNIQUE_CUSTOMER_ID'].first().to_dict()
            join_dates = merged.groupby('UNIQUE_CUSTOMER_ID')['join_date'].min().to_dict()

            verified_club_members = set(join_dates.keys())
            print(f"  Verified Club Members (via order matching): {len(verified_club_members):,}")
        else:
            print("  No cashback orders found!")
            return
    else:
        verified_club_members = matched_customers
        join_dates = {cid: cashback_customers[cid] for cid in matched_customers}

    # Now analyze these verified members
    print(f"\n{'='*80}")
    print(f"VERIFIED CLUB MEMBERS (Conservative Definition): {len(verified_club_members):,}")
    print(f"{'='*80}")

    # Split orders by period
    before_df = orders[orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = orders[orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Get stats for verified members
    def get_period_stats(df, customer_ids):
        subset = df[df['UNIQUE_CUSTOMER_ID'].isin(customer_ids)]
        if len(subset) == 0:
            return pd.DataFrame()
        stats = subset.groupby('UNIQUE_CUSTOMER_ID').agg({
            'ORDER_NUMBER': 'count',
            'COMPLETED_AT_DATE': ['min', 'max'],
            'GROSS_AMOUNT_DKK': 'mean',
            'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean',
        })
        stats.columns = ['orders', 'first_order', 'last_order', 'avg_aov', 'avg_profit']
        stats['days_span'] = (stats['last_order'] - stats['first_order']).dt.days
        return stats

    before_stats = get_period_stats(before_df, verified_club_members)
    after_stats = get_period_stats(after_df, verified_club_members)

    # Categorize each verified Club member
    categories = {
        'best': [],
        'medium': [],
        'new_active': [],
        'new_single': [],
        'lapsed_returned': [],
        'inactive': [],
    }

    for customer_id in verified_club_members:
        before = before_stats.loc[customer_id] if customer_id in before_stats.index else None
        after = after_stats.loc[customer_id] if customer_id in after_stats.index else None

        has_before = before is not None
        before_orders = int(before['orders']) if has_before else 0
        before_days = int(before['days_span']) if has_before else 0

        has_after = after is not None
        after_orders = int(after['orders']) if has_after else 0
        after_days = int(after['days_span']) if has_after else 0

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
    print("VERIFIED CLUB MEMBER BREAKDOWN BY PURCHASE BEHAVIOR")
    print(f"{'='*80}")

    total = len(verified_club_members)
    for cat, members in categories.items():
        pct = len(members) / total * 100 if total > 0 else 0
        print(f"\n{cat.upper().replace('_', ' ')}: {len(members):,} ({pct:.1f}%)")

        if len(members) > 0:
            cat_after = after_stats[after_stats.index.isin(members)]
            if len(cat_after) > 0:
                print(f"  Avg orders (after): {cat_after['orders'].mean():.2f}")
                print(f"  Avg AOV: {cat_after['avg_aov'].mean():.0f} DKK")
                print(f"  Avg profit/order: {cat_after['avg_profit'].mean():.0f} DKK")

    # Summary
    print(f"\n{'='*80}")
    print("SUMMARY: VERIFIED CLUB MEMBERS (Conservative)")
    print(f"{'='*80}")
    print(f"""
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Category              │ Count      │ % of Club │ Description                    │
├───────────────────────┼────────────┼───────────┼────────────────────────────────┤
│ BEST                  │ {len(categories['best']):>10,} │ {len(categories['best'])/total*100 if total > 0 else 0:>7.1f}%  │ 2+ orders, 60+ days BOTH      │
│ MEDIUM                │ {len(categories['medium']):>10,} │ {len(categories['medium'])/total*100 if total > 0 else 0:>7.1f}%  │ 1+ before, 2+/60d after       │
├───────────────────────┼────────────┼───────────┼────────────────────────────────┤
│ NEW ACTIVE            │ {len(categories['new_active']):>10,} │ {len(categories['new_active'])/total*100 if total > 0 else 0:>7.1f}%  │ No before, 2+/60d after       │
│ NEW SINGLE            │ {len(categories['new_single']):>10,} │ {len(categories['new_single'])/total*100 if total > 0 else 0:>7.1f}%  │ No before, only 1 order       │
│ LAPSED RETURNED       │ {len(categories['lapsed_returned']):>10,} │ {len(categories['lapsed_returned'])/total*100 if total > 0 else 0:>7.1f}%  │ Had before, only 1 after      │
│ INACTIVE/SHORT SPAN   │ {len(categories['inactive']):>10,} │ {len(categories['inactive'])/total*100 if total > 0 else 0:>7.1f}%  │ Other (short span, etc)       │
├───────────────────────┼────────────┼───────────┼────────────────────────────────┤
│ TOTAL                 │ {total:>10,} │  100.0%   │                                │
└─────────────────────────────────────────────────────────────────────────────────┘

COMPARISON TO SIMPLE DEFINITION:
- Simple (customerGroup.key = 'club'): 201,477 members
- Conservative (cashback verified):    {total:,} members
- Difference:                          {201477 - total:,} ({(201477 - total)/201477*100:.1f}% excluded)

The Simple definition includes customers who:
- Were tagged as 'club' but never engaged with cashback
- May have orders counted BEFORE they actually joined
- May not be real Club participants
""")

    return categories


def main():
    orders, cashback_customers = load_data()
    categories = analyze_club_members(orders, cashback_customers)


if __name__ == "__main__":
    main()
