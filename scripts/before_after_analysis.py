#!/usr/bin/env python3
"""
Before/After Club Analysis

This script analyzes customer behavior before and after joining the Trendhim Club
by linking Order History data with Club membership information.

Approach:
1. Load Order History CSV files (contains UNIQUE_CUSTOMER_ID)
2. Load Club orders from database (orders with customer_group_key='club')
3. Link via ORDER_NUMBER to get UNIQUE_CUSTOMER_ID for Club members
4. For each Club member, find all their orders and split by join date
5. Calculate before vs after metrics
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import glob

# Configuration
ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
OUTPUT_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/scripts/analysis_results")

def load_order_history():
    """Load all Order History CSV files into a single DataFrame."""
    print("Loading Order History files...")
    csv_files = list(ORDER_HISTORY_PATH.glob("*.csv"))
    print(f"Found {len(csv_files)} CSV files")

    dfs = []
    for f in csv_files:
        print(f"  Loading {f.name}...")
        df = pd.read_csv(f, low_memory=False)
        dfs.append(df)

    order_history = pd.concat(dfs, ignore_index=True)

    # Clean up column names
    order_history.columns = order_history.columns.str.strip()

    # Convert date column
    order_history['COMPLETED_AT_DATE'] = pd.to_datetime(order_history['COMPLETED_AT_DATE'])

    # Remove duplicates (some files might overlap)
    order_history = order_history.drop_duplicates(subset=['ORDER_NUMBER'])

    print(f"Total orders loaded: {len(order_history):,}")
    print(f"Unique customers: {order_history['UNIQUE_CUSTOMER_ID'].nunique():,}")
    print(f"Date range: {order_history['COMPLETED_AT_DATE'].min()} to {order_history['COMPLETED_AT_DATE'].max()}")

    return order_history

def identify_club_members(order_history):
    """
    Identify Club members by looking at orders during the Club period
    that have the characteristics of Club orders.

    Since we don't have direct access to the database, we'll use the Order History
    and assume customers who ordered multiple times after April 2025
    with certain patterns are likely Club members.

    Alternative: If we can export Club order numbers from the database, we can use that.
    """
    print("\nIdentifying Club members...")

    # Filter to Club period (April 2025 onwards)
    club_period = order_history[order_history['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()
    print(f"Orders in Club period (Apr 2025+): {len(club_period):,}")

    # Get customers with orders in Club period
    club_period_customers = club_period['UNIQUE_CUSTOMER_ID'].unique()
    print(f"Customers with orders in Club period: {len(club_period_customers):,}")

    return club_period_customers, club_period

def calculate_customer_metrics(order_history, customer_ids, split_date=None):
    """
    Calculate metrics for a set of customers, optionally split by a date.

    If split_date is provided, calculates metrics for before and after periods.
    """
    # Filter to relevant customers
    customer_orders = order_history[order_history['UNIQUE_CUSTOMER_ID'].isin(customer_ids)].copy()

    if split_date is not None:
        before = customer_orders[customer_orders['COMPLETED_AT_DATE'] < split_date]
        after = customer_orders[customer_orders['COMPLETED_AT_DATE'] >= split_date]

        return {
            'before': calculate_period_metrics(before),
            'after': calculate_period_metrics(after),
            'before_orders': before,
            'after_orders': after
        }
    else:
        return calculate_period_metrics(customer_orders)

def calculate_period_metrics(orders_df):
    """Calculate aggregate metrics for a period."""
    if len(orders_df) == 0:
        return {
            'total_orders': 0,
            'total_customers': 0,
            'avg_orders_per_customer': 0,
            'avg_aov': 0,
            'avg_profit': 0,
            'total_revenue': 0
        }

    customer_stats = orders_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'GROSS_AMOUNT_DKK': ['mean', 'sum'],
        'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean'
    }).reset_index()

    customer_stats.columns = ['customer_id', 'order_count', 'avg_order_value', 'total_spent', 'avg_profit']

    return {
        'total_orders': len(orders_df),
        'total_customers': len(customer_stats),
        'avg_orders_per_customer': customer_stats['order_count'].mean(),
        'median_orders_per_customer': customer_stats['order_count'].median(),
        'avg_aov': orders_df['GROSS_AMOUNT_DKK'].mean(),
        'avg_profit': orders_df['PROFIT_TRACKING_TOTAL_PROFIT_DKK'].mean(),
        'total_revenue': orders_df['GROSS_AMOUNT_DKK'].sum()
    }

def analyze_before_after(order_history, club_customers):
    """
    For customers who exist both before and after Club launch,
    analyze their behavior change.
    """
    print("\n" + "="*60)
    print("BEFORE/AFTER ANALYSIS")
    print("="*60)

    # Get all orders for Club period customers
    club_customer_orders = order_history[
        order_history['UNIQUE_CUSTOMER_ID'].isin(club_customers)
    ].copy()

    # Find customers who have orders BOTH before and after Club launch
    orders_before = club_customer_orders[club_customer_orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE]
    orders_after = club_customer_orders[club_customer_orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE]

    customers_before = set(orders_before['UNIQUE_CUSTOMER_ID'].unique())
    customers_after = set(orders_after['UNIQUE_CUSTOMER_ID'].unique())
    customers_both = customers_before & customers_after

    print(f"\nCustomers with orders BEFORE Club launch: {len(customers_before):,}")
    print(f"Customers with orders AFTER Club launch: {len(customers_after):,}")
    print(f"Customers with orders in BOTH periods: {len(customers_both):,}")

    if len(customers_both) == 0:
        print("No customers found with orders in both periods!")
        return None

    # Analyze the "both periods" cohort
    print(f"\nAnalyzing {len(customers_both):,} customers with orders in both periods...")

    both_orders = order_history[order_history['UNIQUE_CUSTOMER_ID'].isin(customers_both)]
    both_before = both_orders[both_orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE]
    both_after = both_orders[both_orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE]

    # Calculate per-customer metrics
    before_stats = both_before.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'GROSS_AMOUNT_DKK': 'mean',
        'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean',
        'COMPLETED_AT_DATE': ['min', 'max']
    }).reset_index()
    before_stats.columns = ['customer_id', 'orders', 'aov', 'profit', 'first_order', 'last_order']

    after_stats = both_after.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'GROSS_AMOUNT_DKK': 'mean',
        'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean',
        'COMPLETED_AT_DATE': ['min', 'max']
    }).reset_index()
    after_stats.columns = ['customer_id', 'orders', 'aov', 'profit', 'first_order', 'last_order']

    # Calculate days active and orders per month
    before_stats['days_active'] = (before_stats['last_order'] - before_stats['first_order']).dt.days + 1
    before_stats['orders_per_month'] = before_stats['orders'] / (before_stats['days_active'] / 30.44)

    after_stats['days_active'] = (after_stats['last_order'] - after_stats['first_order']).dt.days + 1
    after_stats['orders_per_month'] = after_stats['orders'] / (after_stats['days_active'] / 30.44)

    # Merge for comparison
    comparison = before_stats.merge(
        after_stats,
        on='customer_id',
        suffixes=('_before', '_after')
    )

    # Calculate changes
    comparison['order_change'] = comparison['orders_after'] - comparison['orders_before']
    comparison['aov_change'] = comparison['aov_after'] - comparison['aov_before']
    comparison['freq_change'] = comparison['orders_per_month_after'] - comparison['orders_per_month_before']

    print("\n" + "-"*60)
    print("RESULTS: Customers Active in Both Periods")
    print("-"*60)

    print(f"\nSample Size: {len(comparison):,} customers")

    print("\n📊 BEFORE Club (Pre-April 2025):")
    print(f"   Total orders: {before_stats['orders'].sum():,}")
    print(f"   Avg orders/customer: {before_stats['orders'].mean():.2f}")
    print(f"   Avg AOV: {before_stats['aov'].mean():.2f} DKK")
    print(f"   Avg Profit/order: {before_stats['profit'].mean():.2f} DKK")

    print("\n📊 AFTER Club (April 2025+):")
    print(f"   Total orders: {after_stats['orders'].sum():,}")
    print(f"   Avg orders/customer: {after_stats['orders'].mean():.2f}")
    print(f"   Avg AOV: {after_stats['aov'].mean():.2f} DKK")
    print(f"   Avg Profit/order: {after_stats['profit'].mean():.2f} DKK")

    print("\n📈 CHANGE (After - Before):")
    print(f"   Avg orders change: {comparison['order_change'].mean():+.2f}")
    print(f"   Avg AOV change: {comparison['aov_change'].mean():+.2f} DKK")
    print(f"   Avg monthly frequency change: {comparison['freq_change'].mean():+.4f} orders/month")

    # Percentage changes
    pct_orders = ((after_stats['orders'].mean() / before_stats['orders'].mean()) - 1) * 100
    pct_aov = ((after_stats['aov'].mean() / before_stats['aov'].mean()) - 1) * 100

    print("\n📊 PERCENTAGE CHANGE:")
    print(f"   Orders per customer: {pct_orders:+.1f}%")
    print(f"   Average Order Value: {pct_aov:+.1f}%")

    # Distribution of changes
    print("\n📊 DISTRIBUTION OF CHANGES:")
    print(f"   Customers who ordered MORE after: {(comparison['order_change'] > 0).sum():,} ({(comparison['order_change'] > 0).mean()*100:.1f}%)")
    print(f"   Customers who ordered SAME: {(comparison['order_change'] == 0).sum():,} ({(comparison['order_change'] == 0).mean()*100:.1f}%)")
    print(f"   Customers who ordered LESS after: {(comparison['order_change'] < 0).sum():,} ({(comparison['order_change'] < 0).mean()*100:.1f}%)")

    return comparison

def main():
    # Create output directory
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

    # Load data
    order_history = load_order_history()

    # Identify customers active in Club period
    club_customers, club_orders = identify_club_members(order_history)

    # Run before/after analysis
    comparison = analyze_before_after(order_history, club_customers)

    if comparison is not None:
        # Save results
        output_file = OUTPUT_PATH / "before_after_comparison.csv"
        comparison.to_csv(output_file, index=False)
        print(f"\n✅ Results saved to: {output_file}")

    print("\n" + "="*60)
    print("ANALYSIS COMPLETE")
    print("="*60)

if __name__ == "__main__":
    main()
