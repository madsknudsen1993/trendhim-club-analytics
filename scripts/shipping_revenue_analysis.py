#!/usr/bin/env python3
"""
Comprehensive Shipping Revenue Analysis

Analyzes:
1. Overall shipping revenue Before vs After Club launch (all customers)
2. Club vs Non-Club shipping revenue (during Club period)
3. Free shipping rates by segment
4. Impact of lower Club threshold (199 vs 299 DKK)

Key Question: How has shipping revenue changed with the Club program?
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration
ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
ANALYSIS_END_DATE = pd.Timestamp("2026-01-31")

# Free shipping thresholds (DKK)
NORMAL_FREE_SHIPPING_THRESHOLD = 299
CLUB_FREE_SHIPPING_THRESHOLD = 199


def load_order_history():
    """Load all Order History CSV files."""
    print("Loading Order History files...")
    csv_files = list(ORDER_HISTORY_PATH.glob("*.csv"))

    dfs = []
    for f in csv_files:
        df = pd.read_csv(f, low_memory=False)
        dfs.append(df)
        print(f"  Loaded {len(df):,} rows from {f.name}")

    order_history = pd.concat(dfs, ignore_index=True)
    order_history.columns = order_history.columns.str.strip()
    order_history['COMPLETED_AT_DATE'] = pd.to_datetime(order_history['COMPLETED_AT_DATE'])
    order_history = order_history.drop_duplicates(subset=['ORDER_NUMBER'])

    # Convert to numeric
    for col in ['SHIPPING_GROSS_AMOUNT_DKK', 'GROSS_AMOUNT_DKK', 'PROFIT_TRACKING_TOTAL_PROFIT_DKK']:
        order_history[col] = pd.to_numeric(order_history[col], errors='coerce').fillna(0)

    # Filter to valid orders
    order_history = order_history[
        (order_history['ORDER_STATE'] == 'Complete') &
        (order_history['IS_INTERNAL_ORDER'] == False) &
        (order_history['IS_ORDER_RESEND'] == False) &
        (order_history['IS_AN_ORDER_EXCHANGE'] == False)
    ].copy()

    print(f"\nTotal valid orders: {len(order_history):,}")
    print(f"Date range: {order_history['COMPLETED_AT_DATE'].min().date()} to {order_history['COMPLETED_AT_DATE'].max().date()}")

    return order_history


def get_club_orders_from_db():
    """Get Club order numbers from the PostgreSQL database."""
    print("\nConnecting to PostgreSQL database...")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = """
        SELECT DISTINCT order_number
        FROM "order"
        WHERE customer_group_key = 'club'
          AND created_at >= '2025-04-01'
        """

        cursor.execute(query)
        results = cursor.fetchall()

        club_order_numbers = set(row['order_number'] for row in results)
        print(f"Found {len(club_order_numbers):,} Club orders from database")

        cursor.close()
        conn.close()

        return club_order_numbers

    except Exception as e:
        print(f"Database connection failed: {e}")
        return None


def analyze_overall_before_after(order_history):
    """Analyze shipping revenue before vs after Club launch (all customers)."""
    print("\n" + "=" * 70)
    print("ANALYSIS 1: OVERALL SHIPPING - BEFORE vs AFTER CLUB LAUNCH")
    print("=" * 70)

    # Split by Club launch date
    before_df = order_history[order_history['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = order_history[
        (order_history['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE) &
        (order_history['COMPLETED_AT_DATE'] <= ANALYSIS_END_DATE)
    ].copy()

    # Calculate months
    before_months = (CLUB_LAUNCH_DATE - before_df['COMPLETED_AT_DATE'].min()).days / 30.44
    after_months = (ANALYSIS_END_DATE - CLUB_LAUNCH_DATE).days / 30.44

    # Add free shipping flag (based on normal threshold of 299 DKK)
    before_df['is_free_shipping'] = before_df['SHIPPING_GROSS_AMOUNT_DKK'] == 0
    after_df['is_free_shipping'] = after_df['SHIPPING_GROSS_AMOUNT_DKK'] == 0

    # Calculate metrics
    results = {
        'before': {
            'orders': len(before_df),
            'months': round(before_months, 1),
            'orders_per_month': round(len(before_df) / before_months, 0),
            'total_shipping': round(before_df['SHIPPING_GROSS_AMOUNT_DKK'].sum(), 0),
            'avg_shipping_per_order': round(before_df['SHIPPING_GROSS_AMOUNT_DKK'].mean(), 2),
            'median_shipping': round(before_df['SHIPPING_GROSS_AMOUNT_DKK'].median(), 2),
            'free_shipping_pct': round(before_df['is_free_shipping'].mean() * 100, 1),
            'monthly_shipping_revenue': round(before_df['SHIPPING_GROSS_AMOUNT_DKK'].sum() / before_months, 0),
        },
        'after': {
            'orders': len(after_df),
            'months': round(after_months, 1),
            'orders_per_month': round(len(after_df) / after_months, 0),
            'total_shipping': round(after_df['SHIPPING_GROSS_AMOUNT_DKK'].sum(), 0),
            'avg_shipping_per_order': round(after_df['SHIPPING_GROSS_AMOUNT_DKK'].mean(), 2),
            'median_shipping': round(after_df['SHIPPING_GROSS_AMOUNT_DKK'].median(), 2),
            'free_shipping_pct': round(after_df['is_free_shipping'].mean() * 100, 1),
            'monthly_shipping_revenue': round(after_df['SHIPPING_GROSS_AMOUNT_DKK'].sum() / after_months, 0),
        }
    }

    print(f"\n{'Metric':<30} {'Before Club':<20} {'After Club':<20} {'Change':<15}")
    print("-" * 85)
    print(f"{'Period':<30} {'Jan 2023 - Mar 2025':<20} {'Apr 2025 - Jan 2026':<20}")
    print(f"{'Months':<30} {results['before']['months']:<20} {results['after']['months']:<20}")
    print(f"{'Total Orders':<30} {results['before']['orders']:,}".ljust(50) + f"{results['after']['orders']:,}")
    print(f"{'Orders/Month':<30} {results['before']['orders_per_month']:,.0f}".ljust(50) + f"{results['after']['orders_per_month']:,.0f}")
    print("-" * 85)
    print(f"{'Avg Shipping/Order (DKK)':<30} {results['before']['avg_shipping_per_order']:.2f}".ljust(50) + f"{results['after']['avg_shipping_per_order']:.2f}".ljust(20) + f"{(results['after']['avg_shipping_per_order']/results['before']['avg_shipping_per_order']-1)*100:+.1f}%")
    print(f"{'Median Shipping/Order (DKK)':<30} {results['before']['median_shipping']:.2f}".ljust(50) + f"{results['after']['median_shipping']:.2f}")
    print(f"{'Free Shipping %':<30} {results['before']['free_shipping_pct']:.1f}%".ljust(50) + f"{results['after']['free_shipping_pct']:.1f}%".ljust(20) + f"{results['after']['free_shipping_pct']-results['before']['free_shipping_pct']:+.1f}pp")
    print("-" * 85)
    print(f"{'Total Shipping Revenue (DKK)':<30} {results['before']['total_shipping']:,.0f}".ljust(50) + f"{results['after']['total_shipping']:,.0f}")
    print(f"{'Monthly Shipping Rev (DKK)':<30} {results['before']['monthly_shipping_revenue']:,.0f}".ljust(50) + f"{results['after']['monthly_shipping_revenue']:,.0f}".ljust(20) + f"{(results['after']['monthly_shipping_revenue']/results['before']['monthly_shipping_revenue']-1)*100:+.1f}%")

    return results, before_df, after_df


def analyze_club_vs_nonclub(order_history, club_order_numbers):
    """Analyze Club vs Non-Club shipping during Club period."""
    print("\n" + "=" * 70)
    print("ANALYSIS 2: CLUB vs NON-CLUB SHIPPING (Apr 2025 - Jan 2026)")
    print("=" * 70)

    # Filter to Club period
    club_period = order_history[
        (order_history['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE) &
        (order_history['COMPLETED_AT_DATE'] <= ANALYSIS_END_DATE)
    ].copy()

    # Tag Club vs Non-Club orders
    club_period['is_club_order'] = club_period['ORDER_NUMBER'].isin(club_order_numbers)
    club_period['is_free_shipping'] = club_period['SHIPPING_GROSS_AMOUNT_DKK'] == 0

    club_orders = club_period[club_period['is_club_order']].copy()
    nonclub_orders = club_period[~club_period['is_club_order']].copy()

    print(f"\nClub Orders: {len(club_orders):,} ({len(club_orders)/len(club_period)*100:.1f}%)")
    print(f"Non-Club Orders: {len(nonclub_orders):,} ({len(nonclub_orders)/len(club_period)*100:.1f}%)")

    # Calculate metrics
    results = {
        'club': {
            'orders': len(club_orders),
            'total_shipping': round(club_orders['SHIPPING_GROSS_AMOUNT_DKK'].sum(), 0),
            'avg_shipping_per_order': round(club_orders['SHIPPING_GROSS_AMOUNT_DKK'].mean(), 2),
            'median_shipping': round(club_orders['SHIPPING_GROSS_AMOUNT_DKK'].median(), 2),
            'free_shipping_pct': round(club_orders['is_free_shipping'].mean() * 100, 1),
            'avg_order_value': round(club_orders['GROSS_AMOUNT_DKK'].mean(), 2),
            'avg_profit': round(club_orders['PROFIT_TRACKING_TOTAL_PROFIT_DKK'].mean(), 2),
        },
        'nonclub': {
            'orders': len(nonclub_orders),
            'total_shipping': round(nonclub_orders['SHIPPING_GROSS_AMOUNT_DKK'].sum(), 0),
            'avg_shipping_per_order': round(nonclub_orders['SHIPPING_GROSS_AMOUNT_DKK'].mean(), 2),
            'median_shipping': round(nonclub_orders['SHIPPING_GROSS_AMOUNT_DKK'].median(), 2),
            'free_shipping_pct': round(nonclub_orders['is_free_shipping'].mean() * 100, 1),
            'avg_order_value': round(nonclub_orders['GROSS_AMOUNT_DKK'].mean(), 2),
            'avg_profit': round(nonclub_orders['PROFIT_TRACKING_TOTAL_PROFIT_DKK'].mean(), 2),
        }
    }

    print(f"\n{'Metric':<30} {'Club Orders':<20} {'Non-Club Orders':<20} {'Difference':<15}")
    print("-" * 85)
    print(f"{'Total Orders':<30} {results['club']['orders']:,}".ljust(50) + f"{results['nonclub']['orders']:,}")
    print(f"{'Avg Order Value (DKK)':<30} {results['club']['avg_order_value']:.2f}".ljust(50) + f"{results['nonclub']['avg_order_value']:.2f}".ljust(20) + f"{results['club']['avg_order_value']-results['nonclub']['avg_order_value']:+.2f}")
    print("-" * 85)
    print(f"{'Avg Shipping/Order (DKK)':<30} {results['club']['avg_shipping_per_order']:.2f}".ljust(50) + f"{results['nonclub']['avg_shipping_per_order']:.2f}".ljust(20) + f"{results['club']['avg_shipping_per_order']-results['nonclub']['avg_shipping_per_order']:+.2f}")
    print(f"{'Median Shipping (DKK)':<30} {results['club']['median_shipping']:.2f}".ljust(50) + f"{results['nonclub']['median_shipping']:.2f}")
    print(f"{'Free Shipping %':<30} {results['club']['free_shipping_pct']:.1f}%".ljust(50) + f"{results['nonclub']['free_shipping_pct']:.1f}%".ljust(20) + f"{results['club']['free_shipping_pct']-results['nonclub']['free_shipping_pct']:+.1f}pp")
    print("-" * 85)
    print(f"{'Total Shipping Revenue (DKK)':<30} {results['club']['total_shipping']:,.0f}".ljust(50) + f"{results['nonclub']['total_shipping']:,.0f}")
    print(f"{'Avg Profit/Order (DKK)':<30} {results['club']['avg_profit']:.2f}".ljust(50) + f"{results['nonclub']['avg_profit']:.2f}".ljust(20) + f"{results['club']['avg_profit']-results['nonclub']['avg_profit']:+.2f}")

    return results, club_orders, nonclub_orders


def analyze_shipping_by_order_value(club_orders, nonclub_orders):
    """Analyze shipping by order value buckets to understand threshold impact."""
    print("\n" + "=" * 70)
    print("ANALYSIS 3: SHIPPING BY ORDER VALUE (Threshold Impact)")
    print("=" * 70)

    # Define value buckets
    buckets = [
        (0, 199, "0-199 (Below Club threshold)"),
        (199, 299, "199-299 (Club free, Non-Club paid)"),
        (299, 500, "299-500 (Both free)"),
        (500, float('inf'), "500+ (Both free)"),
    ]

    print(f"\nFree Shipping Thresholds:")
    print(f"  Club Members: {CLUB_FREE_SHIPPING_THRESHOLD} DKK")
    print(f"  Non-Club:     {NORMAL_FREE_SHIPPING_THRESHOLD} DKK")
    print(f"\n{'Order Value Range':<35} {'Club Free %':<15} {'Non-Club Free %':<18} {'Club Orders':<15} {'Non-Club Orders':<15}")
    print("-" * 100)

    for low, high, label in buckets:
        club_bucket = club_orders[
            (club_orders['GROSS_AMOUNT_DKK'] > low) &
            (club_orders['GROSS_AMOUNT_DKK'] <= high)
        ]
        nonclub_bucket = nonclub_orders[
            (nonclub_orders['GROSS_AMOUNT_DKK'] > low) &
            (nonclub_orders['GROSS_AMOUNT_DKK'] <= high)
        ]

        club_free_pct = (club_bucket['SHIPPING_GROSS_AMOUNT_DKK'] == 0).mean() * 100 if len(club_bucket) > 0 else 0
        nonclub_free_pct = (nonclub_bucket['SHIPPING_GROSS_AMOUNT_DKK'] == 0).mean() * 100 if len(nonclub_bucket) > 0 else 0

        print(f"{label:<35} {club_free_pct:.1f}%".ljust(50) + f"{nonclub_free_pct:.1f}%".ljust(18) + f"{len(club_bucket):,}".ljust(15) + f"{len(nonclub_bucket):,}")

    # Special focus: 199-299 range (where Club gets free, Non-Club pays)
    print("\n" + "-" * 70)
    print("FOCUS: 199-299 DKK Range (Club gets free shipping, Non-Club pays)")
    print("-" * 70)

    club_199_299 = club_orders[
        (club_orders['GROSS_AMOUNT_DKK'] > 199) &
        (club_orders['GROSS_AMOUNT_DKK'] <= 299)
    ]
    nonclub_199_299 = nonclub_orders[
        (nonclub_orders['GROSS_AMOUNT_DKK'] > 199) &
        (nonclub_orders['GROSS_AMOUNT_DKK'] <= 299)
    ]

    club_free = (club_199_299['SHIPPING_GROSS_AMOUNT_DKK'] == 0).sum()
    club_paid = (club_199_299['SHIPPING_GROSS_AMOUNT_DKK'] > 0).sum()
    nonclub_free = (nonclub_199_299['SHIPPING_GROSS_AMOUNT_DKK'] == 0).sum()
    nonclub_paid = (nonclub_199_299['SHIPPING_GROSS_AMOUNT_DKK'] > 0).sum()

    # Calculate shipping subsidy (what Trendhim pays for Club free shipping)
    # For Club orders in 199-299 range that got free shipping
    club_free_orders = club_199_299[club_199_299['SHIPPING_GROSS_AMOUNT_DKK'] == 0]
    # Estimate avg shipping cost from Non-Club paid orders in same range
    nonclub_paid_orders = nonclub_199_299[nonclub_199_299['SHIPPING_GROSS_AMOUNT_DKK'] > 0]
    avg_shipping_cost = nonclub_paid_orders['SHIPPING_GROSS_AMOUNT_DKK'].mean() if len(nonclub_paid_orders) > 0 else 30

    shipping_subsidy = len(club_free_orders) * avg_shipping_cost

    print(f"\nClub Orders (199-299 DKK range): {len(club_199_299):,}")
    print(f"  - Free Shipping: {club_free:,} ({club_free/len(club_199_299)*100:.1f}%)")
    print(f"  - Paid Shipping: {club_paid:,} ({club_paid/len(club_199_299)*100:.1f}%)")

    print(f"\nNon-Club Orders (199-299 DKK range): {len(nonclub_199_299):,}")
    print(f"  - Free Shipping: {nonclub_free:,} ({nonclub_free/len(nonclub_199_299)*100:.1f}%)")
    print(f"  - Paid Shipping: {nonclub_paid:,} ({nonclub_paid/len(nonclub_199_299)*100:.1f}%)")

    print(f"\nEstimated Shipping Subsidy (Club period):")
    print(f"  Avg shipping cost: ~{avg_shipping_cost:.0f} DKK")
    print(f"  Club free orders (199-299): {len(club_free_orders):,}")
    print(f"  Estimated subsidy: {shipping_subsidy:,.0f} DKK")

    return {
        'club_199_299': len(club_199_299),
        'club_199_299_free': club_free,
        'nonclub_199_299': len(nonclub_199_299),
        'nonclub_199_299_free': nonclub_free,
        'estimated_subsidy': round(shipping_subsidy, 0),
    }


def analyze_club_member_before_after(order_history, club_order_numbers):
    """Track specific Club members' shipping before/after joining."""
    print("\n" + "=" * 70)
    print("ANALYSIS 4: CLUB MEMBERS - BEFORE vs AFTER JOINING")
    print("=" * 70)

    # Identify Club member customer IDs
    club_period = order_history[order_history['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()
    club_orders = club_period[club_period['ORDER_NUMBER'].isin(club_order_numbers)]
    club_member_ids = set(club_orders['UNIQUE_CUSTOMER_ID'].unique())

    print(f"\nClub Members identified: {len(club_member_ids):,}")

    # Get all orders from these customers
    member_orders = order_history[order_history['UNIQUE_CUSTOMER_ID'].isin(club_member_ids)].copy()

    # Split into before/after Club launch
    member_before = member_orders[member_orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE]
    member_after = member_orders[member_orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE]

    # Calculate shipping metrics
    results = {
        'members': len(club_member_ids),
        'before': {
            'orders': len(member_before),
            'avg_shipping': round(member_before['SHIPPING_GROSS_AMOUNT_DKK'].mean(), 2) if len(member_before) > 0 else 0,
            'free_shipping_pct': round((member_before['SHIPPING_GROSS_AMOUNT_DKK'] == 0).mean() * 100, 1) if len(member_before) > 0 else 0,
            'avg_order_value': round(member_before['GROSS_AMOUNT_DKK'].mean(), 2) if len(member_before) > 0 else 0,
        },
        'after': {
            'orders': len(member_after),
            'avg_shipping': round(member_after['SHIPPING_GROSS_AMOUNT_DKK'].mean(), 2),
            'free_shipping_pct': round((member_after['SHIPPING_GROSS_AMOUNT_DKK'] == 0).mean() * 100, 1),
            'avg_order_value': round(member_after['GROSS_AMOUNT_DKK'].mean(), 2),
        }
    }

    print(f"\n{'Metric':<30} {'Before Club':<20} {'After Club':<20} {'Change':<15}")
    print("-" * 85)
    print(f"{'Orders':<30} {results['before']['orders']:,}".ljust(50) + f"{results['after']['orders']:,}")
    print(f"{'Avg Order Value (DKK)':<30} {results['before']['avg_order_value']:.2f}".ljust(50) + f"{results['after']['avg_order_value']:.2f}".ljust(20) + f"{results['after']['avg_order_value']-results['before']['avg_order_value']:+.2f}")
    print(f"{'Avg Shipping/Order (DKK)':<30} {results['before']['avg_shipping']:.2f}".ljust(50) + f"{results['after']['avg_shipping']:.2f}".ljust(20) + f"{results['after']['avg_shipping']-results['before']['avg_shipping']:+.2f}")
    print(f"{'Free Shipping %':<30} {results['before']['free_shipping_pct']:.1f}%".ljust(50) + f"{results['after']['free_shipping_pct']:.1f}%".ljust(20) + f"{results['after']['free_shipping_pct']-results['before']['free_shipping_pct']:+.1f}pp")

    return results


def main():
    print("=" * 70)
    print("COMPREHENSIVE SHIPPING REVENUE ANALYSIS")
    print("=" * 70)

    # Load data
    order_history = load_order_history()

    # Get Club orders from database
    club_order_numbers = get_club_orders_from_db()

    if club_order_numbers is None:
        print("\n⚠️  Could not connect to database. Running partial analysis...")
        # Fall back to before/after analysis only
        overall_results, before_df, after_df = analyze_overall_before_after(order_history)
        return

    # Run all analyses
    overall_results, before_df, after_df = analyze_overall_before_after(order_history)
    club_nonclub_results, club_orders, nonclub_orders = analyze_club_vs_nonclub(order_history, club_order_numbers)
    threshold_results = analyze_shipping_by_order_value(club_orders, nonclub_orders)
    member_results = analyze_club_member_before_after(order_history, club_order_numbers)

    # Summary
    print("\n" + "=" * 70)
    print("EXECUTIVE SUMMARY")
    print("=" * 70)

    print("""
KEY FINDINGS:

1. OVERALL SHIPPING REVENUE (Before vs After Club):
   - Monthly shipping revenue: {before_monthly:,.0f} → {after_monthly:,.0f} DKK ({monthly_change:+.1f}%)
   - Avg shipping/order: {before_avg:.2f} → {after_avg:.2f} DKK
   - Free shipping rate: {before_free:.1f}% → {after_free:.1f}%

2. CLUB vs NON-CLUB (During Club Period):
   - Club avg shipping/order: {club_avg:.2f} DKK
   - Non-Club avg shipping/order: {nonclub_avg:.2f} DKK
   - Difference: {ship_diff:+.2f} DKK (Club pays {ship_diff_pct:.1f}% less)
   - Club free shipping rate: {club_free:.1f}% vs Non-Club: {nonclub_free:.1f}%

3. THRESHOLD IMPACT (199-299 DKK range):
   - This is where Club gets free shipping but Non-Club pays
   - Club orders in range: {club_range:,} ({club_range_free_pct:.1f}% get free shipping)
   - Non-Club orders in range: {nonclub_range:,} ({nonclub_range_free_pct:.1f}% get free shipping)
   - Estimated shipping subsidy: {subsidy:,.0f} DKK

4. CLUB MEMBERS (Before vs After Joining):
   - Members tracked: {members:,}
   - Avg shipping/order: {member_before:.2f} → {member_after:.2f} DKK ({member_change:+.2f})
   - Free shipping rate: {member_free_before:.1f}% → {member_free_after:.1f}%
""".format(
        before_monthly=overall_results['before']['monthly_shipping_revenue'],
        after_monthly=overall_results['after']['monthly_shipping_revenue'],
        monthly_change=(overall_results['after']['monthly_shipping_revenue']/overall_results['before']['monthly_shipping_revenue']-1)*100,
        before_avg=overall_results['before']['avg_shipping_per_order'],
        after_avg=overall_results['after']['avg_shipping_per_order'],
        before_free=overall_results['before']['free_shipping_pct'],
        after_free=overall_results['after']['free_shipping_pct'],
        club_avg=club_nonclub_results['club']['avg_shipping_per_order'],
        nonclub_avg=club_nonclub_results['nonclub']['avg_shipping_per_order'],
        ship_diff=club_nonclub_results['club']['avg_shipping_per_order']-club_nonclub_results['nonclub']['avg_shipping_per_order'],
        ship_diff_pct=(1-club_nonclub_results['club']['avg_shipping_per_order']/club_nonclub_results['nonclub']['avg_shipping_per_order'])*100,
        club_free=club_nonclub_results['club']['free_shipping_pct'],
        nonclub_free=club_nonclub_results['nonclub']['free_shipping_pct'],
        club_range=threshold_results['club_199_299'],
        club_range_free_pct=threshold_results['club_199_299_free']/threshold_results['club_199_299']*100 if threshold_results['club_199_299'] > 0 else 0,
        nonclub_range=threshold_results['nonclub_199_299'],
        nonclub_range_free_pct=threshold_results['nonclub_199_299_free']/threshold_results['nonclub_199_299']*100 if threshold_results['nonclub_199_299'] > 0 else 0,
        subsidy=threshold_results['estimated_subsidy'],
        members=member_results['members'],
        member_before=member_results['before']['avg_shipping'],
        member_after=member_results['after']['avg_shipping'],
        member_change=member_results['after']['avg_shipping']-member_results['before']['avg_shipping'],
        member_free_before=member_results['before']['free_shipping_pct'],
        member_free_after=member_results['after']['free_shipping_pct'],
    ))


if __name__ == "__main__":
    main()
