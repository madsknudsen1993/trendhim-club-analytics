#!/usr/bin/env python3
"""
Shipping Analysis with ACTUAL Correct Thresholds from Trendhim System

Denmark (DK):
- Club: 199 DKK
- Non-Club: 449 DKK
- Subsidy Zone: 199-449 DKK
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

# ACTUAL CORRECT thresholds from Trendhim system
DK_CLUB_THRESHOLD = 199
DK_NONCLUB_THRESHOLD = 449


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
    """Analyze the 199-449 DKK subsidy zone."""

    # Filter to Club period
    club_period = orders[
        (orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE) &
        (orders['COMPLETED_AT_DATE'] <= ANALYSIS_END)
    ].copy()

    club_period['is_club_order'] = club_period['ORDER_NUMBER'].isin(club_order_numbers)
    club_period['is_free_shipping'] = club_period['SHIPPING_GROSS_AMOUNT_DKK'] == 0

    print("\n" + "=" * 80)
    print("SHIPPING ANALYSIS WITH ACTUAL CORRECT THRESHOLDS")
    print(f"Club: {DK_CLUB_THRESHOLD} DKK | Non-Club: {DK_NONCLUB_THRESHOLD} DKK")
    print(f"Subsidy Zone: {DK_CLUB_THRESHOLD}-{DK_NONCLUB_THRESHOLD} DKK")
    print("=" * 80)

    # Define value buckets with CORRECT thresholds
    club_period['value_bucket'] = pd.cut(
        club_period['GROSS_AMOUNT_DKK'],
        bins=[0, 199, 449, 700, float('inf')],
        labels=['0-199 (Below Club)', '199-449 (SUBSIDY ZONE)', '449-700 (Both free)', '700+ (Both free)']
    )

    print("\n" + "-" * 80)
    print("CLUB vs NON-CLUB BY VALUE BUCKET")
    print("-" * 80)

    for is_club in [True, False]:
        label = "CLUB" if is_club else "NON-CLUB"
        subset = club_period[club_period['is_club_order'] == is_club]

        print(f"\n{label} Orders ({len(subset):,} total):")

        for bucket in ['0-199 (Below Club)', '199-449 (SUBSIDY ZONE)', '449-700 (Both free)', '700+ (Both free)']:
            bucket_orders = subset[subset['value_bucket'] == bucket]
            if len(bucket_orders) > 0:
                free_pct = bucket_orders['is_free_shipping'].mean() * 100
                avg_ship = bucket_orders['SHIPPING_GROSS_AMOUNT_DKK'].mean()
                count_pct = len(bucket_orders) / len(subset) * 100
                print(f"  {bucket}: {len(bucket_orders):>8,} ({count_pct:>5.1f}%) | Free: {free_pct:>5.1f}% | Avg Ship: {avg_ship:>6.2f} DKK")

    # Focus on SUBSIDY ZONE (199-449 DKK)
    print("\n" + "=" * 80)
    print(f"SUBSIDY ZONE DEEP DIVE: {DK_CLUB_THRESHOLD}-{DK_NONCLUB_THRESHOLD} DKK")
    print("(Club should get free shipping, Non-Club should pay)")
    print("=" * 80)

    subsidy_zone = club_period[club_period['value_bucket'] == '199-449 (SUBSIDY ZONE)']
    club_subsidy = subsidy_zone[subsidy_zone['is_club_order']]
    nonclub_subsidy = subsidy_zone[~subsidy_zone['is_club_order']]

    print(f"\nClub orders ({DK_CLUB_THRESHOLD}-{DK_NONCLUB_THRESHOLD} DKK): {len(club_subsidy):,}")
    club_free = club_subsidy[club_subsidy['is_free_shipping']]
    club_paid = club_subsidy[~club_subsidy['is_free_shipping']]
    print(f"  - Free shipping: {len(club_free):,} ({len(club_free)/len(club_subsidy)*100:.1f}%)")
    print(f"  - Paid shipping: {len(club_paid):,} ({len(club_paid)/len(club_subsidy)*100:.1f}%)")
    print(f"  - Avg shipping (all): {club_subsidy['SHIPPING_GROSS_AMOUNT_DKK'].mean():.2f} DKK")
    if len(club_paid) > 0:
        print(f"  - Avg shipping (paid only): {club_paid['SHIPPING_GROSS_AMOUNT_DKK'].mean():.2f} DKK")

    print(f"\nNon-Club orders ({DK_CLUB_THRESHOLD}-{DK_NONCLUB_THRESHOLD} DKK): {len(nonclub_subsidy):,}")
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

    print(f"\nAvg shipping Non-Club pays (in {DK_CLUB_THRESHOLD}-{DK_NONCLUB_THRESHOLD} zone): {avg_shipping_nonclub_pays:.2f} DKK")

    print(f"\nMethod 1: ALL Club free orders in subsidy zone")
    print(f"  Club free orders ({DK_CLUB_THRESHOLD}-{DK_NONCLUB_THRESHOLD}): {method1_orders:,}")
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

Our Analysis with CORRECT thresholds (199-449):
  Method 1 (all Club free): {method1_subsidy:,.0f} DKK ({method1_subsidy/10:,.0f}/mo)
  Method 2 (incremental):   {method2_subsidy:,.0f} DKK ({method2_subsidy/10:,.0f}/mo)
  Club free orders in zone: {method1_orders:,}
""")

    # Detailed breakdown of shipping amounts
    print("\n" + "=" * 80)
    print("DETAILED SHIPPING REVENUE COMPARISON")
    print("=" * 80)

    club_total_ship = club_subsidy['SHIPPING_GROSS_AMOUNT_DKK'].sum()
    nonclub_total_ship = nonclub_subsidy['SHIPPING_GROSS_AMOUNT_DKK'].sum()

    # What WOULD Club have paid if they had Non-Club rates?
    # Apply Non-Club free shipping rate and avg paid amount to Club orders
    expected_club_paid_orders = len(club_subsidy) * (1 - nonclub_free_rate)
    expected_club_ship_revenue = expected_club_paid_orders * avg_shipping_nonclub_pays

    actual_vs_expected = club_total_ship - expected_club_ship_revenue

    print(f"\nIn the {DK_CLUB_THRESHOLD}-{DK_NONCLUB_THRESHOLD} DKK zone:")
    print(f"  Club actual shipping revenue: {club_total_ship:,.0f} DKK")
    print(f"  If Club had Non-Club rates:   {expected_club_ship_revenue:,.0f} DKK")
    print(f"  Lost revenue (Club benefit):  {actual_vs_expected:,.0f} DKK")
    print(f"  Monthly lost revenue:         {actual_vs_expected/10:,.0f} DKK")

    return {
        'method1_subsidy': method1_subsidy,
        'method2_subsidy': method2_subsidy,
        'club_free_in_zone': method1_orders,
        'lost_revenue': actual_vs_expected,
        'club_free_rate': club_free_rate,
        'nonclub_free_rate': nonclub_free_rate,
    }


def main():
    orders, club_order_numbers = load_data()
    if orders is None:
        return

    results = analyze_subsidy_zone(orders, club_order_numbers)

    print("\n" + "=" * 80)
    print("FINAL ANSWERS")
    print("=" * 80)
    print(f"""
Q1: What is the shipping cost of having the Club?
    Lost shipping revenue: {abs(results['lost_revenue']):,.0f} DKK (10 months)
    Monthly: {abs(results['lost_revenue'])/10:,.0f} DKK

Q1.a: Loss in shipping revenue?
    Method 1 (all Club free in zone): {results['method1_subsidy']:,.0f} DKK (10 mo) = {results['method1_subsidy']/10:,.0f}/mo
    Method 2 (incremental only):      {results['method2_subsidy']:,.0f} DKK (10 mo) = {results['method2_subsidy']/10:,.0f}/mo

Q1.b: How many do we offer free shipping to after Club?
    Club free in 199-449 zone: {results['club_free_in_zone']:,} orders (10 months)
    Club free shipping rate: {results['club_free_rate']*100:.1f}%
    vs Non-Club free rate:   {results['nonclub_free_rate']*100:.1f}%
    Incremental:             {(results['club_free_rate']-results['nonclub_free_rate'])*100:.1f}pp

Q1.c: How much free shipping do we offer?
    {results['club_free_in_zone']:,} orders × ~{results['method1_subsidy']/results['club_free_in_zone']:.0f} DKK = {results['method1_subsidy']:,.0f} DKK
""")


if __name__ == "__main__":
    main()
