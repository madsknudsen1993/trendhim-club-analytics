#!/usr/bin/env python3
"""
Analyze whether cashback is already reflected in profit figures.

If cashback reduces revenue before profit calculation, then:
- Orders WITH cashback redemption should have LOWER profit than
- Orders WITHOUT cashback redemption (same products/AOV)
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
    """Load all Order History CSV files."""
    print("Loading Order History files...")
    csv_files = list(ORDER_HISTORY_PATH.glob("*.csv"))

    dfs = []
    for f in csv_files:
        df = pd.read_csv(f, low_memory=False)
        dfs.append(df)

    order_history = pd.concat(dfs, ignore_index=True)
    order_history.columns = order_history.columns.str.strip()
    order_history['COMPLETED_AT_DATE'] = pd.to_datetime(order_history['COMPLETED_AT_DATE'])
    order_history = order_history.drop_duplicates(subset=['ORDER_NUMBER'])

    return order_history

def get_orders_with_cashback():
    """
    Get orders where customers used cashback (balance > 0).
    """
    print("\nQuerying database for orders with cashback usage...")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get Club orders WITH cashback balance recorded
        query = f"""
        WITH customer_join_dates AS (
            SELECT
                customer_id,
                MIN(recorded_at) as join_date
            FROM customer_cashback
            GROUP BY customer_id
        ),
        conservative_club_orders AS (
            SELECT
                o.order_number,
                o.customer_id,
                o.created_at
            FROM "order" o
            INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
            WHERE o.customer_group_key = 'club'
              AND o.created_at >= '{ANALYSIS_START}'
              AND o.created_at < '{ANALYSIS_END}'
              AND o.created_at >= cjd.join_date
        ),
        -- Find customers who USED cashback (had positive balance that was redeemed)
        customers_using_cashback AS (
            SELECT DISTINCT customer_id
            FROM customer_cashback
            WHERE balance_cents > 0
              AND recorded_at >= '{ANALYSIS_START}'
              AND recorded_at < '{ANALYSIS_END}'
        )
        SELECT
            cco.order_number,
            CASE WHEN cuc.customer_id IS NOT NULL THEN true ELSE false END as used_cashback
        FROM conservative_club_orders cco
        LEFT JOIN customers_using_cashback cuc ON cco.customer_id = cuc.customer_id
        """

        cursor.execute(query)
        results = cursor.fetchall()

        orders_with_cb = {row['order_number'] for row in results if row['used_cashback']}
        orders_no_cb = {row['order_number'] for row in results if not row['used_cashback']}

        print(f"Club orders with cashback: {len(orders_with_cb):,}")
        print(f"Club orders without cashback: {len(orders_no_cb):,}")

        cursor.close()
        conn.close()

        return orders_with_cb, orders_no_cb

    except Exception as e:
        print(f"Database error: {e}")
        return set(), set()

def analyze_cashback_impact(order_history, orders_with_cb, orders_no_cb):
    """Compare profit for orders with vs without cashback."""

    # Filter to analysis period
    mask = (order_history['COMPLETED_AT_DATE'] >= ANALYSIS_START) & \
           (order_history['COMPLETED_AT_DATE'] < ANALYSIS_END)
    analysis_orders = order_history[mask].copy()

    print(f"\n{'='*60}")
    print("CASHBACK IMPACT ON PROFIT")
    print(f"{'='*60}")

    # Get orders in each category
    cb_orders = analysis_orders[analysis_orders['ORDER_NUMBER'].isin(orders_with_cb)]
    no_cb_orders = analysis_orders[analysis_orders['ORDER_NUMBER'].isin(orders_no_cb)]

    print(f"\nOrders matched:")
    print(f"   Club + Using Cashback: {len(cb_orders):,}")
    print(f"   Club + No Cashback: {len(no_cb_orders):,}")

    # Compare profit
    profit_col = 'PROFIT_TRACKING_TOTAL_PROFIT_DKK'
    aov_col = 'GROSS_AMOUNT_DKK'

    cb_avg_profit = cb_orders[profit_col].mean()
    no_cb_avg_profit = no_cb_orders[profit_col].mean()

    cb_avg_aov = cb_orders[aov_col].mean()
    no_cb_avg_aov = no_cb_orders[aov_col].mean()

    print(f"\n📊 PROFIT COMPARISON:")
    print(f"   Club + Using Cashback: {cb_avg_profit:.2f} DKK")
    print(f"   Club + No Cashback:    {no_cb_avg_profit:.2f} DKK")
    print(f"   Difference: {cb_avg_profit - no_cb_avg_profit:+.2f} DKK")

    print(f"\n📊 AOV COMPARISON:")
    print(f"   Club + Using Cashback: {cb_avg_aov:.2f} DKK")
    print(f"   Club + No Cashback:    {no_cb_avg_aov:.2f} DKK")
    print(f"   Difference: {cb_avg_aov - no_cb_avg_aov:+.2f} DKK")

    print(f"\n📊 PROFIT MARGIN:")
    cb_margin = (cb_orders[profit_col].sum() / cb_orders[aov_col].sum()) * 100
    no_cb_margin = (no_cb_orders[profit_col].sum() / no_cb_orders[aov_col].sum()) * 100
    print(f"   Club + Using Cashback: {cb_margin:.2f}%")
    print(f"   Club + No Cashback:    {no_cb_margin:.2f}%")

    # Control for AOV - compare at similar AOV ranges
    print(f"\n📊 CONTROLLING FOR AOV:")
    print("   Comparing orders in same AOV bucket to isolate cashback effect...")

    for aov_min, aov_max in [(200, 300), (300, 400), (400, 500), (500, 600)]:
        cb_bucket = cb_orders[(cb_orders[aov_col] >= aov_min) & (cb_orders[aov_col] < aov_max)]
        no_cb_bucket = no_cb_orders[(no_cb_orders[aov_col] >= aov_min) & (no_cb_orders[aov_col] < aov_max)]

        if len(cb_bucket) > 50 and len(no_cb_bucket) > 50:
            cb_profit = cb_bucket[profit_col].mean()
            no_cb_profit = no_cb_bucket[profit_col].mean()
            diff = cb_profit - no_cb_profit

            print(f"\n   AOV {aov_min}-{aov_max} DKK:")
            print(f"      Using Cashback: {cb_profit:.2f} DKK ({len(cb_bucket):,} orders)")
            print(f"      No Cashback:    {no_cb_profit:.2f} DKK ({len(no_cb_bucket):,} orders)")
            print(f"      Difference:     {diff:+.2f} DKK")

    print(f"\n{'='*60}")
    print("INTERPRETATION")
    print(f"{'='*60}")

    profit_diff = cb_avg_profit - no_cb_avg_profit

    if profit_diff < -10:
        print(f"\n✓ Orders with cashback have LOWER profit ({profit_diff:.2f} DKK)")
        print("  This confirms: Cashback IS already reflected in profit figures!")
        print("  When customers redeem cashback, revenue decreases → profit decreases")
        print("")
        print("  IMPLICATION: Cashback should NOT be subtracted again in ROI calculation")
    elif abs(profit_diff) <= 10:
        print(f"\n⚠️  Profit difference is small ({profit_diff:.2f} DKK)")
        print("  Need to analyze at similar AOV buckets to control for mix effects")
    else:
        print(f"\n❌ Orders with cashback have HIGHER profit ({profit_diff:.2f} DKK)")
        print("  This is unexpected and needs further investigation")

def main():
    order_history = load_order_history()
    orders_with_cb, orders_no_cb = get_orders_with_cashback()

    if not orders_with_cb:
        print("Could not get cashback data from database")
        return

    analyze_cashback_impact(order_history, orders_with_cb, orders_no_cb)

if __name__ == "__main__":
    main()
