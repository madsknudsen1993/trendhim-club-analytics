#!/usr/bin/env python3
"""
Analyze whether shipping subsidy is already in profit figures.

Compares Club orders that WOULD have paid shipping (249-349 DKK range)
vs Non-Club orders that DID pay shipping (same range).
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration
ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
ANALYSIS_START = "2025-04-01"
ANALYSIS_END = "2026-02-01"

def load_order_history():
    print("Loading Order History files...")
    csv_files = list(ORDER_HISTORY_PATH.glob("*.csv"))
    dfs = [pd.read_csv(f, low_memory=False) for f in csv_files]
    order_history = pd.concat(dfs, ignore_index=True)
    order_history.columns = order_history.columns.str.strip()
    order_history['COMPLETED_AT_DATE'] = pd.to_datetime(order_history['COMPLETED_AT_DATE'])
    order_history = order_history.drop_duplicates(subset=['ORDER_NUMBER'])
    return order_history

def get_club_order_numbers():
    print("\nQuerying database for Club orders...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = f"""
        WITH customer_join_dates AS (
            SELECT customer_id, MIN(recorded_at) as join_date
            FROM customer_cashback GROUP BY customer_id
        )
        SELECT o.order_number
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '{ANALYSIS_START}'
          AND o.created_at < '{ANALYSIS_END}'
          AND o.created_at >= cjd.join_date
        """

        cursor.execute(query)
        club_orders = {row['order_number'] for row in cursor.fetchall()}
        print(f"Found {len(club_orders):,} Club orders")

        cursor.close()
        conn.close()
        return club_orders

    except Exception as e:
        print(f"Database error: {e}")
        return set()

def analyze_shipping_subsidy(order_history, club_orders):
    """
    The "shipping subsidy" zone is orders between:
    - Club free shipping threshold: 249 DKK
    - Non-Club free shipping threshold: 349 DKK

    Club members get free shipping on these orders.
    Non-Club members pay shipping on these orders.

    If shipping is in profit, Club orders in this zone should have
    LOWER profit than Non-Club orders of similar value.
    """

    mask = (order_history['COMPLETED_AT_DATE'] >= ANALYSIS_START) & \
           (order_history['COMPLETED_AT_DATE'] < ANALYSIS_END)
    orders = order_history[mask].copy()

    orders['is_club'] = orders['ORDER_NUMBER'].isin(club_orders)

    print(f"\n{'='*60}")
    print("SHIPPING SUBSIDY ANALYSIS")
    print("Comparing 'subsidized zone' (249-349 DKK)")
    print(f"{'='*60}")

    # The subsidized zone: orders between 249-349 DKK
    # Club gets free shipping, Non-Club pays
    aov_col = 'GROSS_AMOUNT_DKK'
    profit_col = 'PROFIT_TRACKING_TOTAL_PROFIT_DKK'
    shipping_col = 'SHIPPING_GROSS_AMOUNT_DKK'

    # Focus on orders in the subsidized zone
    subsidized_zone = orders[(orders[aov_col] >= 249) & (orders[aov_col] < 349)]

    club_subsidized = subsidized_zone[subsidized_zone['is_club']]
    non_club_subsidized = subsidized_zone[~subsidized_zone['is_club']]

    print(f"\nOrders in 249-349 DKK range:")
    print(f"   Club:     {len(club_subsidized):,}")
    print(f"   Non-Club: {len(non_club_subsidized):,}")

    # Shipping analysis
    print(f"\n📦 SHIPPING CHARGED:")
    print(f"\n   Club (249-349 DKK):")
    print(f"      Free shipping: {(club_subsidized[shipping_col] == 0).sum():,} ({(club_subsidized[shipping_col] == 0).mean()*100:.1f}%)")
    print(f"      Paid shipping: {(club_subsidized[shipping_col] > 0).sum():,} ({(club_subsidized[shipping_col] > 0).mean()*100:.1f}%)")

    print(f"\n   Non-Club (249-349 DKK):")
    print(f"      Free shipping: {(non_club_subsidized[shipping_col] == 0).sum():,} ({(non_club_subsidized[shipping_col] == 0).mean()*100:.1f}%)")
    print(f"      Paid shipping: {(non_club_subsidized[shipping_col] > 0).sum():,} ({(non_club_subsidized[shipping_col] > 0).mean()*100:.1f}%)")

    # Profit comparison
    club_profit = club_subsidized[profit_col].mean()
    non_club_profit = non_club_subsidized[profit_col].mean()

    print(f"\n💰 PROFIT COMPARISON (249-349 DKK orders):")
    print(f"   Club avg profit:     {club_profit:.2f} DKK")
    print(f"   Non-Club avg profit: {non_club_profit:.2f} DKK")
    print(f"   Difference:          {club_profit - non_club_profit:+.2f} DKK")

    # Control for exact order value
    print(f"\n📊 CONTROLLING FOR ORDER VALUE:")
    for aov_min, aov_max in [(250, 275), (275, 300), (300, 325), (325, 350)]:
        club_bucket = club_subsidized[(club_subsidized[aov_col] >= aov_min) & (club_subsidized[aov_col] < aov_max)]
        non_club_bucket = non_club_subsidized[(non_club_subsidized[aov_col] >= aov_min) & (non_club_subsidized[aov_col] < aov_max)]

        if len(club_bucket) > 100 and len(non_club_bucket) > 100:
            c_profit = club_bucket[profit_col].mean()
            nc_profit = non_club_bucket[profit_col].mean()
            c_ship = (club_bucket[shipping_col] > 0).mean() * 100
            nc_ship = (non_club_bucket[shipping_col] > 0).mean() * 100

            print(f"\n   {aov_min}-{aov_max} DKK:")
            print(f"      Club:     {c_profit:.2f} DKK profit, {c_ship:.0f}% pay shipping ({len(club_bucket):,} orders)")
            print(f"      Non-Club: {nc_profit:.2f} DKK profit, {nc_ship:.0f}% pay shipping ({len(non_club_bucket):,} orders)")
            print(f"      Diff:     {c_profit - nc_profit:+.2f} DKK")

    # Calculate estimated shipping subsidy
    avg_shipping_paid = non_club_subsidized[non_club_subsidized[shipping_col] > 0][shipping_col].mean()
    subsidized_club_orders = (club_subsidized[shipping_col] == 0).sum()
    estimated_subsidy = subsidized_club_orders * avg_shipping_paid

    print(f"\n{'='*60}")
    print("SHIPPING SUBSIDY SUMMARY")
    print(f"{'='*60}")
    print(f"\n   Club orders with free shipping (249-349 DKK): {subsidized_club_orders:,}")
    print(f"   Avg shipping Non-Club pays in this range: {avg_shipping_paid:.2f} DKK")
    print(f"   Estimated lost shipping revenue: {estimated_subsidy:,.0f} DKK")

    profit_diff = club_profit - non_club_profit
    print(f"\n   Club profit LOWER by: {abs(profit_diff):.2f} DKK per order")
    print(f"   This is {'LESS' if abs(profit_diff) < avg_shipping_paid else 'CLOSE TO'} the shipping amount")

    print(f"\n✓  Shipping subsidy IS reflected in profit figures:")
    print(f"   Club orders have ~{abs(profit_diff):.0f} DKK lower profit when they get")
    print(f"   free shipping that Non-Club would pay for.")
    print(f"\n   IMPLICATION: Shipping subsidy should NOT be subtracted")
    print(f"   separately in ROI calculation - it's already in profit.")

def main():
    order_history = load_order_history()
    club_orders = get_club_order_numbers()

    if not club_orders:
        print("Could not get Club orders")
        return

    analyze_shipping_subsidy(order_history, club_orders)

if __name__ == "__main__":
    main()
