#!/usr/bin/env python3
"""
Extract monthly metrics for Club analytics dashboard.
Outputs data in a format ready for CORE_METRICS in data-source.tsx
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
import json

# Configuration
ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
ANALYSIS_START = "2024-04-01"
ANALYSIS_END = "2026-04-01"

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

    print(f"Loaded {len(order_history):,} orders")
    return order_history

def get_club_orders_with_cashback():
    """Get Club orders with cashback information from database."""
    print("\nQuerying database for Club orders with cashback...")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get Club orders with cashback balance info
        query = f"""
        WITH customer_join_dates AS (
            SELECT
                customer_id,
                MIN(recorded_at) as join_date
            FROM customer_cashback
            GROUP BY customer_id
        )
        SELECT
            o.order_number,
            o.created_at,
            o.customer_id,
            cc.balance_cents,
            cc.currency_code
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        LEFT JOIN customer_cashback cc ON o.order_number = cc.order_number
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '{ANALYSIS_START}'
          AND o.created_at < '{ANALYSIS_END}'
          AND o.created_at >= cjd.join_date
        """

        cursor.execute(query)
        results = cursor.fetchall()

        club_data = pd.DataFrame(results)
        print(f"Found {len(club_data):,} Club orders from database")

        cursor.close()
        conn.close()

        return club_data

    except Exception as e:
        print(f"Database error: {e}")
        return pd.DataFrame()

def calculate_monthly_metrics(order_history, club_data):
    """Calculate monthly metrics for Club orders."""

    # Filter to analysis period
    mask = (order_history['COMPLETED_AT_DATE'] >= ANALYSIS_START) & \
           (order_history['COMPLETED_AT_DATE'] < ANALYSIS_END)
    orders = order_history[mask].copy()

    # Create month column
    orders['month'] = orders['COMPLETED_AT_DATE'].dt.to_period('M')

    # Identify Club orders
    club_order_numbers = set(club_data['order_number']) if len(club_data) > 0 else set()
    orders['is_club'] = orders['ORDER_NUMBER'].isin(club_order_numbers)

    # Identify orders with cashback
    if len(club_data) > 0:
        cb_orders = club_data[club_data['balance_cents'] > 0]['order_number'].unique()
        orders['has_cashback'] = orders['ORDER_NUMBER'].isin(cb_orders)
    else:
        orders['has_cashback'] = False

    # Calculate cashback amount in DKK (approximate from balance_cents)
    # Note: This is balance, not redemption amount
    if len(club_data) > 0:
        club_data['cashback_dkk'] = club_data['balance_cents'] / 100  # Simplified, would need FX
        cb_amounts = club_data.groupby('order_number')['cashback_dkk'].first()
        orders = orders.merge(
            cb_amounts.reset_index().rename(columns={'order_number': 'ORDER_NUMBER'}),
            on='ORDER_NUMBER',
            how='left'
        )
        orders['cashback_dkk'] = orders['cashback_dkk'].fillna(0)
    else:
        orders['cashback_dkk'] = 0

    # Filter to Club orders only
    club_orders = orders[orders['is_club']].copy()

    print(f"\nAnalyzing {len(club_orders):,} Club orders")

    # Calculate monthly metrics
    monthly_metrics = []

    for month in sorted(club_orders['month'].unique()):
        month_data = club_orders[club_orders['month'] == month]
        month_cb = month_data[month_data['has_cashback']]
        month_no_cb = month_data[~month_data['has_cashback']]

        # Shipping categorization
        shipping_free = month_data[month_data['SHIPPING_GROSS_AMOUNT_DKK'] == 0]
        shipping_paid = month_data[month_data['SHIPPING_GROSS_AMOUNT_DKK'] > 0]
        shipping_paid_cb = shipping_paid[shipping_paid['has_cashback']]

        metrics = {
            'month': str(month),
            'totalClubOrders': len(month_data),
            'cashbackOrderCount': len(month_cb),
            'totalCashbackDKK': round(month_cb['cashback_dkk'].sum(), 0),
            'avgCashbackDKK': round(month_cb['cashback_dkk'].mean(), 0) if len(month_cb) > 0 else 0,
            'aovAllClub': round(month_data['GROSS_AMOUNT_DKK'].median(), 0),
            'aovWithCB': round(month_cb['GROSS_AMOUNT_DKK'].median(), 0) if len(month_cb) > 0 else 0,
            'aovWithoutCB': round(month_no_cb['GROSS_AMOUNT_DKK'].median(), 0) if len(month_no_cb) > 0 else 0,
            'avgProfitAllClub': round(month_data['PROFIT_TRACKING_TOTAL_PROFIT_DKK'].median(), 0),
            'avgProfitCBOrders': round(month_cb['PROFIT_TRACKING_TOTAL_PROFIT_DKK'].median(), 0) if len(month_cb) > 0 else 0,
            'shippingPaid': len(shipping_paid),
            'shippingPaidWithCB': len(shipping_paid_cb),
            'shippingFree': len(shipping_free),
        }

        monthly_metrics.append(metrics)

        print(f"{month}: {metrics['totalClubOrders']:,} orders, {metrics['cashbackOrderCount']:,} with CB, AOV {metrics['aovAllClub']} DKK")

    return monthly_metrics

def output_typescript(monthly_metrics):
    """Output TypeScript code for CORE_METRICS."""

    print("\n" + "="*60)
    print("TYPESCRIPT CODE FOR data-source.tsx")
    print("="*60)

    print("""
  // Monthly breakdown - April 2024 to March 2026
  monthlyBreakdown: [""")

    for m in monthly_metrics:
        print(f"""    {{
      month: "{m['month']}",
      totalClubOrders: {m['totalClubOrders']},
      cashbackOrderCount: {m['cashbackOrderCount']},
      totalCashbackDKK: {m['totalCashbackDKK']},
      avgCashbackDKK: {m['avgCashbackDKK']},
      aovAllClub: {m['aovAllClub']},
      aovWithCB: {m['aovWithCB']},
      aovWithoutCB: {m['aovWithoutCB']},
      avgProfitAllClub: {m['avgProfitAllClub']},
      avgProfitCBOrders: {m['avgProfitCBOrders']},
      shippingPaid: {m['shippingPaid']},
      shippingPaidWithCB: {m['shippingPaidWithCB']},
      shippingFree: {m['shippingFree']},
    }},""")

    print("  ],")

def main():
    order_history = load_order_history()
    club_data = get_club_orders_with_cashback()

    if len(club_data) == 0:
        print("Could not get Club data from database")
        # Fall back to using just order history
        club_data = pd.DataFrame({'order_number': [], 'balance_cents': []})

    monthly_metrics = calculate_monthly_metrics(order_history, club_data)
    output_typescript(monthly_metrics)

    # Also save as JSON for reference
    output_path = Path("/Users/madsknudsen/code/trendhim-club-analytics/scripts/monthly_metrics.json")
    with open(output_path, 'w') as f:
        json.dump(monthly_metrics, f, indent=2)
    print(f"\nSaved to {output_path}")

if __name__ == "__main__":
    main()
