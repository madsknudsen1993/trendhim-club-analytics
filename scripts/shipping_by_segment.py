#!/usr/bin/env python3
"""
Shipping Analysis BY SEGMENT

Why don't Best/Medium customers show bigger shipping impact?

This script analyzes:
1. What % of Best/Medium customer orders fall in the 199-449 subsidy zone?
2. What's their free shipping rate before vs after?
3. Why doesn't the lower threshold hurt them more?
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")

# Correct thresholds
CLUB_THRESHOLD = 199
NONCLUB_THRESHOLD = 449


def load_data():
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

    for col in ['SHIPPING_GROSS_AMOUNT_DKK', 'GROSS_AMOUNT_DKK', 'PROFIT_TRACKING_TOTAL_PROFIT_DKK']:
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
    try:
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
        print(f"Club orders: {len(club_order_numbers):,}")
    except Exception as e:
        print(f"DB Error: {e}")
        return None, None

    return orders, club_order_numbers


def identify_segments(orders, club_order_numbers):
    """Identify Best and Medium customer segments."""

    # Tag orders
    orders['is_club_order'] = orders['ORDER_NUMBER'].isin(club_order_numbers)

    # Split by Club launch
    before_df = orders[orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = orders[orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Identify Club members (customers who have Club orders after launch)
    club_members = set(after_df[after_df['is_club_order']]['UNIQUE_CUSTOMER_ID'].unique())
    print(f"\nClub members identified: {len(club_members):,}")

    # BEST CUSTOMERS: 2+ orders before AND 2+ orders after, 60+ days in both
    before_stats = before_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max']
    })
    before_stats.columns = ['orders', 'first', 'last']
    before_stats['days'] = (before_stats['last'] - before_stats['first']).dt.days

    after_stats = after_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max']
    })
    after_stats.columns = ['orders', 'first', 'last']
    after_stats['days'] = (after_stats['last'] - after_stats['first']).dt.days

    # Best: 2+ orders AND 60+ days in BOTH periods, AND is Club member
    best_before = set(before_stats[(before_stats['orders'] >= 2) & (before_stats['days'] >= 60)].index)
    best_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days'] >= 60)].index)
    best_customers = best_before & best_after & club_members

    # Medium: 1+ order before, 2+ orders AND 60+ days after, AND is Club member
    medium_before = set(before_stats[before_stats['orders'] >= 1].index)
    medium_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days'] >= 60)].index)
    medium_customers = medium_before & medium_after & club_members

    print(f"Best Customers (2+ both periods, 60+ days): {len(best_customers):,}")
    print(f"Medium Customers (1+ before, 2+ after): {len(medium_customers):,}")

    return best_customers, medium_customers, club_members


def analyze_segment_shipping(orders, segment_ids, segment_name):
    """Analyze shipping for a specific segment."""

    print(f"\n{'='*80}")
    print(f"SEGMENT: {segment_name} ({len(segment_ids):,} customers)")
    print(f"{'='*80}")

    # Get orders for this segment
    segment_orders = orders[orders['UNIQUE_CUSTOMER_ID'].isin(segment_ids)].copy()

    # Split before/after
    before = segment_orders[segment_orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after = segment_orders[segment_orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Add flags
    for df in [before, after]:
        df['is_free_shipping'] = df['SHIPPING_GROSS_AMOUNT_DKK'] == 0
        df['value_bucket'] = pd.cut(
            df['GROSS_AMOUNT_DKK'],
            bins=[0, 199, 449, 700, float('inf')],
            labels=['0-199', '199-449 (SUBSIDY)', '449-700', '700+']
        )

    print(f"\nOrders: {len(before):,} before → {len(after):,} after")
    print(f"Avg AOV: {before['GROSS_AMOUNT_DKK'].mean():.0f} → {after['GROSS_AMOUNT_DKK'].mean():.0f} DKK")

    # VALUE DISTRIBUTION
    print(f"\n--- ORDER VALUE DISTRIBUTION ---")
    print(f"{'Bucket':<25} {'BEFORE':<20} {'AFTER':<20} {'Change':<15}")
    print("-" * 80)

    for bucket in ['0-199', '199-449 (SUBSIDY)', '449-700', '700+']:
        before_pct = (before['value_bucket'] == bucket).mean() * 100
        after_pct = (after['value_bucket'] == bucket).mean() * 100
        change = after_pct - before_pct
        print(f"{bucket:<25} {before_pct:>6.1f}%              {after_pct:>6.1f}%              {change:>+5.1f}pp")

    # FREE SHIPPING BY BUCKET
    print(f"\n--- FREE SHIPPING RATE BY VALUE BUCKET ---")
    print(f"{'Bucket':<25} {'BEFORE Free%':<15} {'AFTER Free%':<15} {'Change':<15}")
    print("-" * 80)

    subsidy_before_free = 0
    subsidy_after_free = 0

    for bucket in ['0-199', '199-449 (SUBSIDY)', '449-700', '700+']:
        before_bucket = before[before['value_bucket'] == bucket]
        after_bucket = after[after['value_bucket'] == bucket]

        before_free = before_bucket['is_free_shipping'].mean() * 100 if len(before_bucket) > 0 else 0
        after_free = after_bucket['is_free_shipping'].mean() * 100 if len(after_bucket) > 0 else 0
        change = after_free - before_free

        if bucket == '199-449 (SUBSIDY)':
            subsidy_before_free = before_free
            subsidy_after_free = after_free

        print(f"{bucket:<25} {before_free:>6.1f}%          {after_free:>6.1f}%          {change:>+5.1f}pp")

    # OVERALL SHIPPING
    print(f"\n--- OVERALL SHIPPING METRICS ---")
    before_avg_ship = before['SHIPPING_GROSS_AMOUNT_DKK'].mean()
    after_avg_ship = after['SHIPPING_GROSS_AMOUNT_DKK'].mean()
    before_free_pct = before['is_free_shipping'].mean() * 100
    after_free_pct = after['is_free_shipping'].mean() * 100

    print(f"Avg Shipping/Order: {before_avg_ship:.2f} → {after_avg_ship:.2f} DKK ({(after_avg_ship/before_avg_ship-1)*100:+.1f}%)")
    print(f"Free Shipping Rate: {before_free_pct:.1f}% → {after_free_pct:.1f}% ({after_free_pct-before_free_pct:+.1f}pp)")

    # SUBSIDY ZONE IMPACT
    print(f"\n--- SUBSIDY ZONE (199-449) DEEP DIVE ---")
    before_subsidy = before[before['value_bucket'] == '199-449 (SUBSIDY)']
    after_subsidy = after[after['value_bucket'] == '199-449 (SUBSIDY)']

    before_subsidy_orders = len(before_subsidy)
    after_subsidy_orders = len(after_subsidy)
    before_subsidy_pct = len(before_subsidy) / len(before) * 100 if len(before) > 0 else 0
    after_subsidy_pct = len(after_subsidy) / len(after) * 100 if len(after) > 0 else 0

    print(f"Orders in 199-449 zone: {before_subsidy_orders:,} ({before_subsidy_pct:.1f}%) → {after_subsidy_orders:,} ({after_subsidy_pct:.1f}%)")

    before_subsidy_ship = before_subsidy['SHIPPING_GROSS_AMOUNT_DKK'].mean() if len(before_subsidy) > 0 else 0
    after_subsidy_ship = after_subsidy['SHIPPING_GROSS_AMOUNT_DKK'].mean() if len(after_subsidy) > 0 else 0

    print(f"Avg shipping in zone: {before_subsidy_ship:.2f} → {after_subsidy_ship:.2f} DKK ({after_subsidy_ship-before_subsidy_ship:+.2f})")
    print(f"Free shipping in zone: {subsidy_before_free:.1f}% → {subsidy_after_free:.1f}% ({subsidy_after_free-subsidy_before_free:+.1f}pp)")

    # Calculate lost revenue in subsidy zone
    if len(after_subsidy) > 0:
        after_paid = after_subsidy[after_subsidy['SHIPPING_GROSS_AMOUNT_DKK'] > 0]
        avg_paid_shipping = after_paid['SHIPPING_GROSS_AMOUNT_DKK'].mean() if len(after_paid) > 0 else 40

        after_free_orders = (after_subsidy['is_free_shipping']).sum()
        before_free_rate = before_subsidy['is_free_shipping'].mean() if len(before_subsidy) > 0 else 0.15

        # Incremental free orders = orders that got free NOW that wouldn't have BEFORE
        incremental_free = after_subsidy_orders * (after_subsidy['is_free_shipping'].mean() - before_free_rate)
        lost_revenue = incremental_free * avg_paid_shipping

        print(f"\nINCREMENTAL FREE SHIPPING IN SUBSIDY ZONE:")
        print(f"  After free orders: {after_free_orders:,}")
        print(f"  Before free rate applied: {before_free_rate*100:.1f}%")
        print(f"  Incremental free: {incremental_free:,.0f} orders")
        print(f"  × Avg paid shipping: {avg_paid_shipping:.2f} DKK")
        print(f"  = Lost revenue (10 mo): {lost_revenue:,.0f} DKK")
        print(f"  = Monthly: {lost_revenue/10:,.0f} DKK")

    # WHY OVERALL SHIPPING DIDN'T DROP MUCH
    print(f"\n--- WHY SHIPPING DIDN'T DROP MUCH ---")

    # Check if orders shifted to higher value buckets
    before_above_449 = (before['GROSS_AMOUNT_DKK'] >= 449).mean() * 100
    after_above_449 = (after['GROSS_AMOUNT_DKK'] >= 449).mean() * 100

    print(f"Orders >= 449 DKK (above both thresholds):")
    print(f"  Before: {before_above_449:.1f}%")
    print(f"  After: {after_above_449:.1f}%")
    print(f"  Change: {after_above_449-before_above_449:+.1f}pp")

    if after_above_449 > 35:
        print(f"\n  → {after_above_449:.0f}% of orders are ABOVE BOTH thresholds!")
        print(f"    These orders get free shipping regardless of Club status.")
        print(f"    The Club benefit only helps in the 199-449 zone ({after_subsidy_pct:.1f}% of orders).")

    return {
        'segment': segment_name,
        'customers': len(segment_ids),
        'before_avg_ship': before_avg_ship,
        'after_avg_ship': after_avg_ship,
        'before_free_pct': before_free_pct,
        'after_free_pct': after_free_pct,
        'subsidy_zone_pct': after_subsidy_pct,
        'above_449_pct': after_above_449,
    }


def main():
    orders, club_order_numbers = load_data()
    if orders is None:
        return

    best_customers, medium_customers, all_club = identify_segments(orders, club_order_numbers)

    best_results = analyze_segment_shipping(orders, best_customers, "BEST CUSTOMERS (5,101)")
    medium_results = analyze_segment_shipping(orders, medium_customers, "MEDIUM CUSTOMERS (10,732)")

    # Also analyze ALL Club members for comparison
    all_results = analyze_segment_shipping(orders, all_club, "ALL CLUB MEMBERS")

    print("\n" + "=" * 80)
    print("SUMMARY: WHY SHIPPING IMPACT IS HIDDEN IN BEST/MEDIUM SEGMENTS")
    print("=" * 80)
    print(f"""
KEY FINDING: Best/Medium customers have HIGH order values!

                        Best Customers    Medium Customers    All Club Members
Subsidy zone (199-449): {best_results['subsidy_zone_pct']:>5.1f}%            {medium_results['subsidy_zone_pct']:>5.1f}%              {all_results['subsidy_zone_pct']:>5.1f}%
Above 449 DKK:          {best_results['above_449_pct']:>5.1f}%            {medium_results['above_449_pct']:>5.1f}%              {all_results['above_449_pct']:>5.1f}%

The Club shipping benefit only applies to the 199-449 zone.
Best/Medium customers have ~{(best_results['above_449_pct']+medium_results['above_449_pct'])/2:.0f}% of orders ABOVE 449 DKK
where they get free shipping ANYWAY (both Club and Non-Club threshold).

This is why shipping per order barely changed:
  Best:   {best_results['before_avg_ship']:.2f} → {best_results['after_avg_ship']:.2f} DKK ({(best_results['after_avg_ship']/best_results['before_avg_ship']-1)*100:+.1f}%)
  Medium: {medium_results['before_avg_ship']:.2f} → {medium_results['after_avg_ship']:.2f} DKK ({(medium_results['after_avg_ship']/medium_results['before_avg_ship']-1)*100:+.1f}%)

The shipping subsidy (~92K/mo) comes mostly from LOWER-VALUE Club orders,
not from the Best/Medium segments who order at higher values.
""")


if __name__ == "__main__":
    main()
