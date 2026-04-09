#!/usr/bin/env python3
"""
Verify Profit Calculation

This script verifies whether Club members actually have higher average profit
by directly analyzing Power BI data matched with Club membership from database.
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

    print(f"Loaded {len(order_history):,} unique orders")
    return order_history

def get_conservative_club_orders():
    """
    Get Club order numbers using CONSERVATIVE approach:
    - Orders from verified cashback customers
    - Placed AFTER their join date
    - Within analysis period
    """
    print("\nQuerying database for conservative Club orders...")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = f"""
        WITH customer_join_dates AS (
            SELECT
                customer_id,
                MIN(recorded_at) as join_date
            FROM customer_cashback
            GROUP BY customer_id
        )
        SELECT
            o.order_number
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '{ANALYSIS_START}'
          AND o.created_at < '{ANALYSIS_END}'
          AND o.created_at >= cjd.join_date
        """

        cursor.execute(query)
        results = cursor.fetchall()
        club_order_numbers = {row['order_number'] for row in results}

        print(f"Found {len(club_order_numbers):,} conservative Club orders")

        cursor.close()
        conn.close()

        return club_order_numbers

    except Exception as e:
        print(f"Database error: {e}")
        return set()

def analyze_profit_by_group(order_history, club_order_numbers):
    """Analyze profit by Club vs Non-Club using Power BI profit data."""

    # Filter to analysis period
    mask = (order_history['COMPLETED_AT_DATE'] >= ANALYSIS_START) & \
           (order_history['COMPLETED_AT_DATE'] < ANALYSIS_END)
    analysis_orders = order_history[mask].copy()

    print(f"\n{'='*60}")
    print("PROFIT ANALYSIS: CLUB VS NON-CLUB")
    print(f"Analysis Period: {ANALYSIS_START} to {ANALYSIS_END}")
    print(f"{'='*60}")

    # Tag orders as Club or Non-Club
    analysis_orders['is_club'] = analysis_orders['ORDER_NUMBER'].isin(club_order_numbers)

    club_orders = analysis_orders[analysis_orders['is_club']]
    non_club_orders = analysis_orders[~analysis_orders['is_club']]

    print(f"\nTotal orders in period: {len(analysis_orders):,}")
    print(f"Club orders (conservative): {len(club_orders):,}")
    print(f"Non-Club orders: {len(non_club_orders):,}")

    # Calculate profit stats
    club_profit_col = 'PROFIT_TRACKING_TOTAL_PROFIT_DKK'

    club_avg_profit = club_orders[club_profit_col].mean()
    non_club_avg_profit = non_club_orders[club_profit_col].mean()

    print(f"\n📊 AVERAGE ORDER PROFIT:")
    print(f"   Club:     {club_avg_profit:.2f} DKK")
    print(f"   Non-Club: {non_club_avg_profit:.2f} DKK")
    print(f"   Difference: {club_avg_profit - non_club_avg_profit:+.2f} DKK")

    # Calculate total profit
    club_total_profit = club_orders[club_profit_col].sum()
    non_club_total_profit = non_club_orders[club_profit_col].sum()

    print(f"\n📊 TOTAL PROFIT:")
    print(f"   Club:     {club_total_profit:,.2f} DKK")
    print(f"   Non-Club: {non_club_total_profit:,.2f} DKK")

    # Profit distribution
    print(f"\n📊 PROFIT DISTRIBUTION:")
    for label, df in [("Club", club_orders), ("Non-Club", non_club_orders)]:
        print(f"\n   {label}:")
        print(f"      Min:    {df[club_profit_col].min():.2f} DKK")
        print(f"      25%:    {df[club_profit_col].quantile(0.25):.2f} DKK")
        print(f"      Median: {df[club_profit_col].median():.2f} DKK")
        print(f"      75%:    {df[club_profit_col].quantile(0.75):.2f} DKK")
        print(f"      Max:    {df[club_profit_col].max():.2f} DKK")

    # Check if Club orders have higher AOV (which would explain higher profit)
    aov_col = 'GROSS_AMOUNT_DKK'
    club_avg_aov = club_orders[aov_col].mean()
    non_club_avg_aov = non_club_orders[aov_col].mean()

    print(f"\n📊 AVERAGE ORDER VALUE (AOV):")
    print(f"   Club:     {club_avg_aov:.2f} DKK")
    print(f"   Non-Club: {non_club_avg_aov:.2f} DKK")
    print(f"   Difference: {club_avg_aov - non_club_avg_aov:+.2f} DKK ({(club_avg_aov/non_club_avg_aov - 1)*100:+.1f}%)")

    # Check profit margin
    club_profit_margin = (club_total_profit / club_orders[aov_col].sum()) * 100
    non_club_profit_margin = (non_club_total_profit / non_club_orders[aov_col].sum()) * 100

    print(f"\n📊 PROFIT MARGIN:")
    print(f"   Club:     {club_profit_margin:.2f}%")
    print(f"   Non-Club: {non_club_profit_margin:.2f}%")

    return {
        'club_orders': len(club_orders),
        'non_club_orders': len(non_club_orders),
        'club_avg_profit': club_avg_profit,
        'non_club_avg_profit': non_club_avg_profit,
        'club_avg_aov': club_avg_aov,
        'non_club_avg_aov': non_club_avg_aov,
    }

def analyze_shipping_impact(order_history, club_order_numbers):
    """Analyze how shipping affects profit."""

    # Filter to analysis period
    mask = (order_history['COMPLETED_AT_DATE'] >= ANALYSIS_START) & \
           (order_history['COMPLETED_AT_DATE'] < ANALYSIS_END)
    analysis_orders = order_history[mask].copy()

    # Tag Club orders
    analysis_orders['is_club'] = analysis_orders['ORDER_NUMBER'].isin(club_order_numbers)

    # Calculate shipping revenue and its impact
    # SHIPPING_GROSS_AMOUNT_DKK is what customer pays for shipping
    shipping_col = 'SHIPPING_GROSS_AMOUNT_DKK'

    print(f"\n{'='*60}")
    print("SHIPPING ANALYSIS")
    print(f"{'='*60}")

    for label, df in [("Club", analysis_orders[analysis_orders['is_club']]),
                      ("Non-Club", analysis_orders[~analysis_orders['is_club']])]:
        free_shipping = df[df[shipping_col] == 0]
        paid_shipping = df[df[shipping_col] > 0]

        print(f"\n{label}:")
        print(f"   Free shipping orders: {len(free_shipping):,} ({len(free_shipping)/len(df)*100:.1f}%)")
        print(f"   Paid shipping orders: {len(paid_shipping):,} ({len(paid_shipping)/len(df)*100:.1f}%)")

        if len(paid_shipping) > 0:
            print(f"   Avg shipping revenue: {paid_shipping[shipping_col].mean():.2f} DKK")

        # Compare profit for free vs paid shipping
        if len(free_shipping) > 0 and len(paid_shipping) > 0:
            profit_col = 'PROFIT_TRACKING_TOTAL_PROFIT_DKK'
            free_profit = free_shipping[profit_col].mean()
            paid_profit = paid_shipping[profit_col].mean()
            print(f"   Avg profit (free shipping): {free_profit:.2f} DKK")
            print(f"   Avg profit (paid shipping): {paid_profit:.2f} DKK")

def main():
    # Load data
    order_history = load_order_history()

    # Get conservative Club orders
    club_order_numbers = get_conservative_club_orders()

    if not club_order_numbers:
        print("Could not get Club orders from database")
        return

    # Analyze profit
    results = analyze_profit_by_group(order_history, club_order_numbers)

    # Analyze shipping
    analyze_shipping_impact(order_history, club_order_numbers)

    print(f"\n{'='*60}")
    print("CONCLUSION")
    print(f"{'='*60}")

    profit_diff = results['club_avg_profit'] - results['non_club_avg_profit']
    aov_diff = results['club_avg_aov'] - results['non_club_avg_aov']

    if profit_diff > 0:
        print(f"\n⚠️  Club orders show HIGHER average profit (+{profit_diff:.2f} DKK)")
        print(f"\nPossible explanations:")
        print(f"1. Higher AOV (+{aov_diff:.2f} DKK): Club members buy more expensive items")
        print(f"2. Selection bias: Club attracts customers who were already high-value")
        print(f"3. Lower return rates: Club members may have fewer returns/exchanges")
    else:
        print(f"\n✓  Club orders show LOWER average profit ({profit_diff:.2f} DKK)")
        print(f"This aligns with expectations given cashback + shipping subsidies")

if __name__ == "__main__":
    main()
