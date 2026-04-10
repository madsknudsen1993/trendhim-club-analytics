#!/usr/bin/env python3
"""
Shipping Trendline Validation

Creates monthly trendlines to validate shipping metrics:
1. Avg shipping revenue per order over time
2. Free shipping % over time

For segments: Best, Medium, and Control Group (all customers with orders before AND after Club)

Data source: SHIPPING_GROSS_AMOUNT_DKK from PowerBI (already converted to DKK)
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
import json

ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")


def load_data():
    """Load order history and identify Club members."""
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

    # Convert numeric columns
    for col in ['SHIPPING_GROSS_AMOUNT_DKK', 'GROSS_AMOUNT_DKK']:
        orders[col] = pd.to_numeric(orders[col], errors='coerce').fillna(0)

    # Filter valid orders
    orders = orders[
        (orders['ORDER_STATE'] == 'Complete') &
        (orders['IS_INTERNAL_ORDER'] == False) &
        (orders['IS_ORDER_RESEND'] == False) &
        (orders['IS_AN_ORDER_EXCHANGE'] == False)
    ].copy()

    # Add month column for grouping
    orders['month'] = orders['COMPLETED_AT_DATE'].dt.to_period('M')

    print(f"Valid orders: {len(orders):,}")
    print(f"Date range: {orders['COMPLETED_AT_DATE'].min()} to {orders['COMPLETED_AT_DATE'].max()}")

    # Get Club orders from database
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

    orders['is_club_order'] = orders['ORDER_NUMBER'].isin(club_order_numbers)

    return orders, club_order_numbers


def identify_segments(orders, club_order_numbers):
    """Identify Best, Medium, and Control Group segments."""

    before_df = orders[orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = orders[orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Club members
    club_members = set(after_df[after_df['is_club_order']]['UNIQUE_CUSTOMER_ID'].unique())
    print(f"\nClub members: {len(club_members):,}")

    # Customer stats
    def get_customer_stats(df):
        stats = df.groupby('UNIQUE_CUSTOMER_ID').agg({
            'ORDER_NUMBER': 'count',
            'COMPLETED_AT_DATE': ['min', 'max']
        })
        stats.columns = ['orders', 'first', 'last']
        stats['days'] = (stats['last'] - stats['first']).dt.days
        return stats

    before_stats = get_customer_stats(before_df)
    after_stats = get_customer_stats(after_df)

    # BEST: 2+ orders AND 60+ days in BOTH periods, Club member
    best_before = set(before_stats[(before_stats['orders'] >= 2) & (before_stats['days'] >= 60)].index)
    best_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days'] >= 60)].index)
    best_customers = best_before & best_after & club_members

    # MEDIUM: 1+ before, 2+ orders AND 60+ days after, Club member (excluding Best)
    medium_before = set(before_stats[before_stats['orders'] >= 1].index)
    medium_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days'] >= 60)].index)
    medium_customers = (medium_before & medium_after & club_members) - best_customers

    # CONTROL GROUP: Any customer with at least 1 order before AND 1 order after Club launch
    # (This captures behavior change regardless of segment)
    customers_before = set(before_df['UNIQUE_CUSTOMER_ID'].unique())
    customers_after = set(after_df['UNIQUE_CUSTOMER_ID'].unique())
    control_group = customers_before & customers_after

    print(f"Best Customers: {len(best_customers):,}")
    print(f"Medium Customers: {len(medium_customers):,}")
    print(f"Control Group (orders before & after): {len(control_group):,}")

    return best_customers, medium_customers, control_group


def calculate_monthly_metrics(orders, segment_ids, segment_name):
    """Calculate monthly shipping metrics for a segment."""

    segment_orders = orders[orders['UNIQUE_CUSTOMER_ID'].isin(segment_ids)].copy()
    segment_orders['is_free_shipping'] = segment_orders['SHIPPING_GROSS_AMOUNT_DKK'] == 0

    # Group by month
    monthly = segment_orders.groupby('month').agg({
        'ORDER_NUMBER': 'count',
        'SHIPPING_GROSS_AMOUNT_DKK': 'mean',
        'is_free_shipping': 'mean',
        'GROSS_AMOUNT_DKK': 'mean',
    }).reset_index()

    monthly.columns = ['month', 'orders', 'avg_shipping_revenue', 'free_shipping_pct', 'avg_aov']
    monthly['free_shipping_pct'] = monthly['free_shipping_pct'] * 100
    monthly['segment'] = segment_name
    monthly['month_str'] = monthly['month'].astype(str)

    return monthly


def main():
    orders, club_order_numbers = load_data()
    if orders is None:
        return

    best_customers, medium_customers, control_group = identify_segments(orders, club_order_numbers)

    # Calculate monthly metrics for each segment
    print("\n" + "=" * 80)
    print("CALCULATING MONTHLY METRICS")
    print("=" * 80)

    best_monthly = calculate_monthly_metrics(orders, best_customers, "Best Customers")
    medium_monthly = calculate_monthly_metrics(orders, medium_customers, "Medium Customers")
    control_monthly = calculate_monthly_metrics(orders, control_group, "Control Group")

    # Combine all
    all_monthly = pd.concat([best_monthly, medium_monthly, control_monthly], ignore_index=True)

    # Filter to 2023 onwards and exclude incomplete months
    all_monthly = all_monthly[
        (all_monthly['month'] >= '2023-01') &
        (all_monthly['month'] <= '2026-02')  # Exclude current incomplete month
    ]

    # Print summary tables
    print("\n" + "=" * 80)
    print("SHIPPING REVENUE PER ORDER (DKK) - Monthly Trend")
    print("=" * 80)
    print(f"\n{'Month':<10} {'Best':>12} {'Medium':>12} {'Control':>12}")
    print("-" * 50)

    months = sorted(all_monthly['month_str'].unique())
    for month in months:
        month_data = all_monthly[all_monthly['month_str'] == month]
        best_val = month_data[month_data['segment'] == 'Best Customers']['avg_shipping_revenue'].values
        medium_val = month_data[month_data['segment'] == 'Medium Customers']['avg_shipping_revenue'].values
        control_val = month_data[month_data['segment'] == 'Control Group']['avg_shipping_revenue'].values

        best_str = f"{best_val[0]:.2f}" if len(best_val) > 0 else "-"
        medium_str = f"{medium_val[0]:.2f}" if len(medium_val) > 0 else "-"
        control_str = f"{control_val[0]:.2f}" if len(control_val) > 0 else "-"

        # Mark Club launch
        marker = " <-- CLUB LAUNCH" if month == "2025-04" else ""
        print(f"{month:<10} {best_str:>12} {medium_str:>12} {control_str:>12}{marker}")

    print("\n" + "=" * 80)
    print("FREE SHIPPING % - Monthly Trend")
    print("=" * 80)
    print(f"\n{'Month':<10} {'Best':>12} {'Medium':>12} {'Control':>12}")
    print("-" * 50)

    for month in months:
        month_data = all_monthly[all_monthly['month_str'] == month]
        best_val = month_data[month_data['segment'] == 'Best Customers']['free_shipping_pct'].values
        medium_val = month_data[month_data['segment'] == 'Medium Customers']['free_shipping_pct'].values
        control_val = month_data[month_data['segment'] == 'Control Group']['free_shipping_pct'].values

        best_str = f"{best_val[0]:.1f}%" if len(best_val) > 0 else "-"
        medium_str = f"{medium_val[0]:.1f}%" if len(medium_val) > 0 else "-"
        control_str = f"{control_val[0]:.1f}%" if len(control_val) > 0 else "-"

        marker = " <-- CLUB LAUNCH" if month == "2025-04" else ""
        print(f"{month:<10} {best_str:>12} {medium_str:>12} {control_str:>12}{marker}")

    # Calculate before/after averages
    print("\n" + "=" * 80)
    print("BEFORE vs AFTER CLUB LAUNCH COMPARISON")
    print("=" * 80)

    for segment in ['Best Customers', 'Medium Customers', 'Control Group']:
        seg_data = all_monthly[all_monthly['segment'] == segment]
        before = seg_data[seg_data['month'] < '2025-04']
        after = seg_data[seg_data['month'] >= '2025-04']

        before_ship = before['avg_shipping_revenue'].mean()
        after_ship = after['avg_shipping_revenue'].mean()
        before_free = before['free_shipping_pct'].mean()
        after_free = after['free_shipping_pct'].mean()

        print(f"\n{segment}:")
        print(f"  Avg Shipping/Order: {before_ship:.2f} → {after_ship:.2f} DKK ({after_ship - before_ship:+.2f})")
        print(f"  Free Shipping %:    {before_free:.1f}% → {after_free:.1f}% ({after_free - before_free:+.1f}pp)")

    # Export data for charting
    output_path = Path("/Users/madsknudsen/code/trendhim-club-analytics/scripts/output")
    output_path.mkdir(exist_ok=True)

    # Save as CSV
    all_monthly.to_csv(output_path / "shipping_trendline_data.csv", index=False)
    print(f"\n\nData exported to: {output_path / 'shipping_trendline_data.csv'}")

    # Also save as JSON for easy import to dashboard
    chart_data = {
        'months': months,
        'segments': {}
    }

    for segment in ['Best Customers', 'Medium Customers', 'Control Group']:
        seg_data = all_monthly[all_monthly['segment'] == segment].sort_values('month')
        chart_data['segments'][segment] = {
            'avg_shipping_revenue': seg_data['avg_shipping_revenue'].tolist(),
            'free_shipping_pct': seg_data['free_shipping_pct'].tolist(),
            'orders': seg_data['orders'].tolist(),
        }

    with open(output_path / "shipping_trendline_data.json", 'w') as f:
        json.dump(chart_data, f, indent=2)
    print(f"JSON exported to: {output_path / 'shipping_trendline_data.json'}")

    # Validation note
    print("\n" + "=" * 80)
    print("DATA SOURCE VALIDATION")
    print("=" * 80)
    print("""
SHIPPING_GROSS_AMOUNT_DKK is used directly from PowerBI Order History.
- This field is ALREADY converted to DKK by PowerBI
- No additional currency conversion is applied
- Free shipping = SHIPPING_GROSS_AMOUNT_DKK == 0

The shipping thresholds (199/449 DKK for Club/Non-Club) are only used
to identify the "subsidy zone" for cost calculations, NOT for the
trendline metrics shown above.
""")


if __name__ == "__main__":
    main()
