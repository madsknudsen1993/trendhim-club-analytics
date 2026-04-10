#!/usr/bin/env python3
"""
Club Member Breakdown - ENHANCED with Order Type Distinction

For each customer category, shows:
- Total members
- Club Orders (customerGroupKey = 'club')
- Non-Club Orders (regular orders)
- Cashback usage rate

This resolves the ambiguity of whether orders are "Club orders" or not.
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
    """Load order history and Club order identifiers."""
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

    # Get Club order identifiers from database
    print("\nGetting Club orders from database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Get all Club orders (customerGroupKey = 'club')
    cursor.execute("""
        SELECT DISTINCT order_number
        FROM "order"
        WHERE customer_group_key = 'club'
    """)
    club_order_numbers = set(row['order_number'] for row in cursor.fetchall())
    print(f"Club orders found: {len(club_order_numbers):,}")

    # Get cashback records per order (any cashback activity)
    cursor.execute("""
        SELECT DISTINCT order_number
        FROM customer_cashback
        WHERE order_number IS NOT NULL
    """)
    orders_with_cashback = set(row['order_number'] for row in cursor.fetchall())
    print(f"Orders with cashback activity: {len(orders_with_cashback):,}")

    cursor.close()
    conn.close()

    # Mark orders
    orders['is_club_order'] = orders['ORDER_NUMBER'].isin(club_order_numbers)
    orders['used_cashback'] = orders['ORDER_NUMBER'].isin(orders_with_cashback)

    return orders


def analyze_club_members(orders):
    """Analyze Club members with order type distinction."""

    # Split by period
    before_df = orders[orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = orders[orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Identify Club members (customers who placed at least 1 Club order after launch)
    club_orders_after = after_df[after_df['is_club_order']]
    club_members = set(club_orders_after['UNIQUE_CUSTOMER_ID'].unique())

    print(f"\n{'='*80}")
    print(f"CLUB MEMBERS (at least 1 Club order after Apr 2025): {len(club_members):,}")
    print(f"{'='*80}")

    # Calculate stats for each Club member
    def get_period_stats(df, customer_ids, club_only=False):
        """Get order stats for customers in a period."""
        subset = df[df['UNIQUE_CUSTOMER_ID'].isin(customer_ids)]
        if club_only:
            subset = subset[subset['is_club_order']]
        if len(subset) == 0:
            return pd.DataFrame()

        stats = subset.groupby('UNIQUE_CUSTOMER_ID').agg({
            'ORDER_NUMBER': 'count',
            'COMPLETED_AT_DATE': ['min', 'max'],
            'GROSS_AMOUNT_DKK': 'mean',
            'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean',
            'is_club_order': 'sum',
            'used_cashback': 'sum',
        })
        stats.columns = ['orders', 'first_order', 'last_order', 'avg_aov', 'avg_profit', 'club_orders', 'cb_orders']
        stats['days_span'] = (stats['last_order'] - stats['first_order']).dt.days
        stats['non_club_orders'] = stats['orders'] - stats['club_orders']
        return stats

    # Get stats for ALL orders (Club + Non-Club)
    before_stats = get_period_stats(before_df, club_members)
    after_stats = get_period_stats(after_df, club_members)

    # Get stats for ONLY Club orders
    after_club_stats = get_period_stats(after_df, club_members, club_only=True)

    # Categorize each Club member
    categories = {
        'best': [],
        'medium': [],
        'new_active': [],
        'new_single': [],
        'lapsed_returned': [],
        'inactive': [],
    }

    for customer_id in club_members:
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
        # Medium: 1+ before, 2+ orders AND 60+ days after
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

    # Print detailed breakdown with order type distinction
    print(f"\n{'='*80}")
    print("CLUB MEMBER BREAKDOWN WITH ORDER TYPE DISTINCTION")
    print(f"{'='*80}")

    total = len(club_members)
    results = []

    for cat, members in categories.items():
        pct = len(members) / total * 100 if total > 0 else 0

        # Get after-period stats for this category
        cat_after = after_stats[after_stats.index.isin(members)] if len(members) > 0 else pd.DataFrame()

        if len(cat_after) > 0:
            total_orders = int(cat_after['orders'].sum())
            club_orders = int(cat_after['club_orders'].sum())
            non_club_orders = int(cat_after['non_club_orders'].sum())
            cb_orders = int(cat_after['cb_orders'].sum())
            cb_rate = cb_orders / club_orders * 100 if club_orders > 0 else 0
            avg_aov = cat_after['avg_aov'].mean()
            avg_profit = cat_after['avg_profit'].mean()
        else:
            total_orders = club_orders = non_club_orders = cb_orders = 0
            cb_rate = avg_aov = avg_profit = 0

        results.append({
            'category': cat,
            'members': len(members),
            'pct': pct,
            'total_orders_after': total_orders,
            'club_orders': club_orders,
            'non_club_orders': non_club_orders,
            'cb_orders': cb_orders,
            'cb_rate': cb_rate,
            'avg_aov': avg_aov,
            'avg_profit': avg_profit,
        })

        print(f"\n{cat.upper().replace('_', ' ')}: {len(members):,} ({pct:.1f}%)")
        print(f"  Orders after Apr 2025:")
        print(f"    - Total orders:     {total_orders:,}")
        print(f"    - Club orders:      {club_orders:,} ({club_orders/total_orders*100:.1f}% of orders)" if total_orders > 0 else "    - Club orders:      0")
        print(f"    - Non-Club orders:  {non_club_orders:,} ({non_club_orders/total_orders*100:.1f}% of orders)" if total_orders > 0 else "    - Non-Club orders:  0")
        print(f"    - Used cashback:    {cb_orders:,} orders ({cb_rate:.1f}% of Club orders)")
        print(f"  Metrics:")
        print(f"    - Avg AOV:          {avg_aov:.0f} DKK")
        print(f"    - Avg Profit/Order: {avg_profit:.0f} DKK")

    # Summary table
    print(f"\n{'='*80}")
    print("SUMMARY TABLE")
    print(f"{'='*80}")
    print(f"""
┌─────────────────────┬──────────┬─────────┬─────────────┬─────────────┬──────────────┬─────────┐
│ Category            │ Members  │ % Total │ Club Orders │ Non-Club    │ CB Used      │ CB Rate │
├─────────────────────┼──────────┼─────────┼─────────────┼─────────────┼──────────────┼─────────┤""")

    for r in results:
        print(f"│ {r['category'].upper().replace('_', ' '):19} │ {r['members']:>8,} │ {r['pct']:>6.1f}% │ {r['club_orders']:>11,} │ {r['non_club_orders']:>11,} │ {r['cb_orders']:>12,} │ {r['cb_rate']:>6.1f}% │")

    print(f"├─────────────────────┼──────────┼─────────┼─────────────┼─────────────┼──────────────┼─────────┤")
    totals = {
        'members': sum(r['members'] for r in results),
        'club_orders': sum(r['club_orders'] for r in results),
        'non_club_orders': sum(r['non_club_orders'] for r in results),
        'cb_orders': sum(r['cb_orders'] for r in results),
    }
    totals['cb_rate'] = totals['cb_orders'] / totals['club_orders'] * 100 if totals['club_orders'] > 0 else 0
    print(f"│ {'TOTAL':19} │ {totals['members']:>8,} │  100.0% │ {totals['club_orders']:>11,} │ {totals['non_club_orders']:>11,} │ {totals['cb_orders']:>12,} │ {totals['cb_rate']:>6.1f}% │")
    print(f"└─────────────────────┴──────────┴─────────┴─────────────┴─────────────┴──────────────┴─────────┘")

    # Key insight
    print(f"""
KEY INSIGHTS:
─────────────
1. Club Orders vs Non-Club Orders:
   - Club orders are placed WITH Club benefits (customerGroupKey = 'club')
   - Non-Club orders are placed WITHOUT Club benefits (before joining or opted out)

2. Cashback Rate shows what % of Club orders actually USED cashback redemption

3. For 'New Single-Order' members:
   - Their ONE order should be a Club order (they joined then ordered)
   - Check if they're getting Club benefits without returning
""")

    return results


def main():
    orders = load_data()
    results = analyze_club_members(orders)


if __name__ == "__main__":
    main()
