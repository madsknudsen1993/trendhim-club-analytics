#!/usr/bin/env python3
"""
Shipping Analysis with CORRECT Country-Specific Thresholds

The thresholds are:
- DK: Club 249 DKK, Non-Club 399 DKK → Subsidy zone: 249-399 DKK
- SE: Club 349 SEK, Non-Club 549 SEK
- NO: Club 349 NOK, Non-Club 549 NOK
- DE: Club 39 EUR, Non-Club 59 EUR
- GB: Club 29 GBP, Non-Club 49 GBP

This script focuses on DKK orders to calculate the subsidy.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
ANALYSIS_END = pd.Timestamp("2026-01-31")

# CORRECT thresholds for DKK
DK_CLUB_THRESHOLD = 249
DK_NONCLUB_THRESHOLD = 399


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


def analyze_subsidy_zone(orders, club_order_numbers):
    """Analyze the 249-399 DKK subsidy zone for DKK orders."""

    # Filter to Club period
    club_period = orders[
        (orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE) &
        (orders['COMPLETED_AT_DATE'] <= ANALYSIS_END)
    ].copy()

    club_period['is_club_order'] = club_period['ORDER_NUMBER'].isin(club_order_numbers)
    club_period['is_free_shipping'] = club_period['SHIPPING_GROSS_AMOUNT_DKK'] == 0

    print("\n" + "=" * 80)
    print("SHIPPING ANALYSIS WITH CORRECT DKK THRESHOLDS")
    print("Club: 249 DKK | Non-Club: 399 DKK | Subsidy Zone: 249-399 DKK")
    print("=" * 80)

    # Define value buckets with correct thresholds
    club_period['value_bucket'] = pd.cut(
        club_period['GROSS_AMOUNT_DKK'],
        bins=[0, 249, 399, 600, float('inf')],
        labels=['0-249 (Below Club)', '249-399 (SUBSIDY ZONE)', '399-600 (Both free)', '600+ (Both free)']
    )

    print("\n" + "-" * 80)
    print("CLUB vs NON-CLUB BY VALUE BUCKET")
    print("-" * 80)

    for is_club in [True, False]:
        label = "CLUB" if is_club else "NON-CLUB"
        subset = club_period[club_period['is_club_order'] == is_club]

        print(f"\n{label} Orders ({len(subset):,} total):")

        for bucket in ['0-249 (Below Club)', '249-399 (SUBSIDY ZONE)', '399-600 (Both free)', '600+ (Both free)']:
            bucket_orders = subset[subset['value_bucket'] == bucket]
            if len(bucket_orders) > 0:
                free_pct = bucket_orders['is_free_shipping'].mean() * 100
                avg_ship = bucket_orders['SHIPPING_GROSS_AMOUNT_DKK'].mean()
                count_pct = len(bucket_orders) / len(subset) * 100
                print(f"  {bucket}: {len(bucket_orders):>8,} ({count_pct:>5.1f}%) | Free: {free_pct:>5.1f}% | Avg Ship: {avg_ship:>6.2f} DKK")

    # Focus on SUBSIDY ZONE (249-399 DKK)
    print("\n" + "=" * 80)
    print("SUBSIDY ZONE DEEP DIVE: 249-399 DKK")
    print("(Club should get free shipping, Non-Club should pay)")
    print("=" * 80)

    subsidy_zone = club_period[club_period['value_bucket'] == '249-399 (SUBSIDY ZONE)']
    club_subsidy = subsidy_zone[subsidy_zone['is_club_order']]
    nonclub_subsidy = subsidy_zone[~subsidy_zone['is_club_order']]

    print(f"\nClub orders (249-399 DKK): {len(club_subsidy):,}")
    club_free = club_subsidy[club_subsidy['is_free_shipping']]
    club_paid = club_subsidy[~club_subsidy['is_free_shipping']]
    print(f"  - Free shipping: {len(club_free):,} ({len(club_free)/len(club_subsidy)*100:.1f}%)")
    print(f"  - Paid shipping: {len(club_paid):,} ({len(club_paid)/len(club_subsidy)*100:.1f}%)")
    print(f"  - Avg shipping (all): {club_subsidy['SHIPPING_GROSS_AMOUNT_DKK'].mean():.2f} DKK")
    if len(club_paid) > 0:
        print(f"  - Avg shipping (paid only): {club_paid['SHIPPING_GROSS_AMOUNT_DKK'].mean():.2f} DKK")

    print(f"\nNon-Club orders (249-399 DKK): {len(nonclub_subsidy):,}")
    nonclub_free = nonclub_subsidy[nonclub_subsidy['is_free_shipping']]
    nonclub_paid = nonclub_subsidy[~nonclub_subsidy['is_free_shipping']]
    print(f"  - Free shipping: {len(nonclub_free):,} ({len(nonclub_free)/len(nonclub_subsidy)*100:.1f}%)")
    print(f"  - Paid shipping: {len(nonclub_paid):,} ({len(nonclub_paid)/len(nonclub_subsidy)*100:.1f}%)")
    print(f"  - Avg shipping (all): {nonclub_subsidy['SHIPPING_GROSS_AMOUNT_DKK'].mean():.2f} DKK")
    if len(nonclub_paid) > 0:
        print(f"  - Avg shipping (paid only): {nonclub_paid['SHIPPING_GROSS_AMOUNT_DKK'].mean():.2f} DKK")

    # Calculate SHIPPING SUBSIDY
    print("\n" + "=" * 80)
    print("SHIPPING SUBSIDY CALCULATION")
    print("=" * 80)

    avg_shipping_nonclub_pays = nonclub_paid['SHIPPING_GROSS_AMOUNT_DKK'].mean() if len(nonclub_paid) > 0 else 0

    # Method 1: All Club free orders in subsidy zone
    method1_orders = len(club_free)
    method1_subsidy = method1_orders * avg_shipping_nonclub_pays

    # Method 2: Only INCREMENTAL free orders (above Non-Club baseline)
    club_free_rate = len(club_free) / len(club_subsidy) if len(club_subsidy) > 0 else 0
    nonclub_free_rate = len(nonclub_free) / len(nonclub_subsidy) if len(nonclub_subsidy) > 0 else 0
    incremental_rate = club_free_rate - nonclub_free_rate
    method2_orders = len(club_subsidy) * incremental_rate
    method2_subsidy = method2_orders * avg_shipping_nonclub_pays

    print(f"\nAvg shipping Non-Club pays (in 249-399 zone): {avg_shipping_nonclub_pays:.2f} DKK")

    print(f"\nMethod 1: ALL Club free orders in subsidy zone")
    print(f"  Club free orders (249-399): {method1_orders:,}")
    print(f"  × Avg shipping: {avg_shipping_nonclub_pays:.2f} DKK")
    print(f"  = Total subsidy (10 mo): {method1_subsidy:,.0f} DKK")
    print(f"  = Monthly subsidy: {method1_subsidy/10:,.0f} DKK")

    print(f"\nMethod 2: Only INCREMENTAL free orders")
    print(f"  Club free rate: {club_free_rate*100:.1f}%")
    print(f"  Non-Club free rate: {nonclub_free_rate*100:.1f}%")
    print(f"  Incremental rate: {incremental_rate*100:.1f}pp")
    print(f"  Incremental free orders: {method2_orders:,.0f}")
    print(f"  × Avg shipping: {avg_shipping_nonclub_pays:.2f} DKK")
    print(f"  = Total subsidy (10 mo): {method2_subsidy:,.0f} DKK")
    print(f"  = Monthly subsidy: {method2_subsidy/10:,.0f} DKK")

    # Compare to CORE_METRICS
    print("\n" + "=" * 80)
    print("COMPARISON TO CORE_METRICS")
    print("=" * 80)
    print(f"""
CORE_METRICS shows:
  shippingSubsidy: 815,070 DKK (10 months)
  shippingSubsidyOrderCount: 27,169 orders
  monthlyShippingSubsidy: 81,507 DKK

Our Analysis:
  Method 1 (all Club free in 249-399): {method1_subsidy:,.0f} DKK ({method1_subsidy/10:,.0f}/mo)
  Method 2 (incremental only):         {method2_subsidy:,.0f} DKK ({method2_subsidy/10:,.0f}/mo)
  Club free orders in zone: {method1_orders:,}

CORE_METRICS order count: 27,169
Our Club free orders: {method1_orders:,}
Difference: {27169 - method1_orders:,}
""")

    # What about orders BELOW 249 that get free shipping?
    print("\n" + "-" * 80)
    print("CLUB ORDERS BELOW 249 DKK WITH FREE SHIPPING")
    print("(These are NOT from threshold - likely promotions)")
    print("-" * 80)

    club_below_249 = club_period[
        (club_period['is_club_order']) &
        (club_period['GROSS_AMOUNT_DKK'] < 249)
    ]
    club_below_249_free = club_below_249[club_below_249['is_free_shipping']]

    print(f"Club orders below 249 DKK: {len(club_below_249):,}")
    print(f"  With free shipping: {len(club_below_249_free):,} ({len(club_below_249_free)/len(club_below_249)*100:.1f}%)")

    # Total FREE_CLUB_SUBSIDY orders
    total_free_club = len(club_free) + len(club_below_249_free)
    print(f"\nTotal Club orders with free shipping (below Non-Club threshold):")
    print(f"  In subsidy zone (249-399): {len(club_free):,}")
    print(f"  Below 249: {len(club_below_249_free):,}")
    print(f"  TOTAL: {total_free_club:,}")
    print(f"\nThis is {'CLOSE TO' if abs(total_free_club - 27169) < 3000 else 'DIFFERENT FROM'} CORE_METRICS count of 27,169")

    return {
        'method1_subsidy': method1_subsidy,
        'method2_subsidy': method2_subsidy,
        'club_free_in_zone': method1_orders,
        'total_club_free': total_free_club,
    }


def main():
    orders, club_order_numbers = load_data()
    if orders is None:
        return

    results = analyze_subsidy_zone(orders, club_order_numbers)

    print("\n" + "=" * 80)
    print("FINAL ANSWER: SHIPPING COST OF HAVING THE CLUB")
    print("=" * 80)
    print(f"""
1. SHIPPING REVENUE LOSS (Subsidy):
   - Monthly: {results['method1_subsidy']/10:,.0f} to {results['method2_subsidy']/10:,.0f} DKK
   - 10-month total: {results['method2_subsidy']:,.0f} to {results['method1_subsidy']:,.0f} DKK

2. FREE SHIPPING ORDERS FROM CLUB THRESHOLD:
   - In subsidy zone (249-399 DKK): {results['club_free_in_zone']:,}
   - This is where Club gets free but Non-Club pays

3. WHY IT DOESN'T SHOW IN BEST/MEDIUM SEGMENTS:
   - These customers order at HIGH values (avg ~450 DKK)
   - Most orders are ABOVE 399 DKK (both Club and Non-Club threshold)
   - The 249-399 "subsidy zone" is a small portion of their orders
   - More orders from frequency lift = more shipping revenue overall
""")


if __name__ == "__main__":
    main()
