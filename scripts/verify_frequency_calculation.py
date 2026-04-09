#!/usr/bin/env python3
"""
Verify Frequency Calculation for Best Customers Segment

This script checks if the frequency calculation (0.545 before, 0.680 after) is biased.

TWO METHODS COMPARED:
1. BIASED: months_active = (last_order - first_order) / 30.44
   - Inflates frequency for customers who cluster orders

2. UNBIASED: months_active = calendar months in the period
   - Equal time window for all customers

"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

# Configuration
ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
DATA_END_DATE = pd.Timestamp("2026-01-31")  # End of data

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

    print(f"Total orders: {len(order_history):,}")
    print(f"Date range: {order_history['COMPLETED_AT_DATE'].min()} to {order_history['COMPLETED_AT_DATE'].max()}")

    return order_history

def find_robust_sample(order_history):
    """
    Find the Robust Sample: 4,640 customers with:
    - 60+ days history in BOTH before/after periods
    - 2+ orders in BOTH before/after periods
    """
    print("\n" + "="*70)
    print("FINDING ROBUST SAMPLE (Best Customers)")
    print("="*70)

    # Split by Club launch
    before = order_history[order_history['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE]
    after = order_history[order_history['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE]

    # Get customers with 2+ orders in each period
    before_counts = before.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max']
    })
    before_counts.columns = ['orders', 'first_order', 'last_order']
    before_counts['days_span'] = (before_counts['last_order'] - before_counts['first_order']).dt.days

    after_counts = after.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max']
    })
    after_counts.columns = ['orders', 'first_order', 'last_order']
    after_counts['days_span'] = (after_counts['last_order'] - after_counts['first_order']).dt.days

    # Filter: 2+ orders AND 60+ days span in BOTH periods
    qualified_before = set(before_counts[(before_counts['orders'] >= 2) & (before_counts['days_span'] >= 60)].index)
    qualified_after = set(after_counts[(after_counts['orders'] >= 2) & (after_counts['days_span'] >= 60)].index)

    robust_sample = qualified_before & qualified_after
    print(f"\nRobust Sample Size: {len(robust_sample):,} customers")
    print(f"  Qualified before (2+ orders, 60+ days): {len(qualified_before):,}")
    print(f"  Qualified after (2+ orders, 60+ days): {len(qualified_after):,}")
    print(f"  Both: {len(robust_sample):,}")

    return robust_sample, before, after

def calculate_frequency_both_methods(orders_df, customers, period_name, period_months=None):
    """
    Calculate frequency using BOTH methods:
    1. Biased: orders / (first-to-last span)
    2. Unbiased: orders / calendar_months
    """
    filtered = orders_df[orders_df['UNIQUE_CUSTOMER_ID'].isin(customers)]

    # Per-customer stats
    customer_stats = filtered.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max']
    })
    customer_stats.columns = ['orders', 'first_order', 'last_order']

    # Method 1: BIASED (first-to-last span)
    customer_stats['days_span'] = (customer_stats['last_order'] - customer_stats['first_order']).dt.days + 1
    customer_stats['months_biased'] = customer_stats['days_span'] / 30.44
    customer_stats['freq_biased'] = customer_stats['orders'] / customer_stats['months_biased']

    # Method 2: UNBIASED (fixed calendar months)
    if period_months:
        customer_stats['months_fixed'] = period_months
    else:
        # Use actual calendar months from data
        period_start = filtered['COMPLETED_AT_DATE'].min()
        period_end = filtered['COMPLETED_AT_DATE'].max()
        total_days = (period_end - period_start).days + 1
        customer_stats['months_fixed'] = total_days / 30.44

    customer_stats['freq_unbiased'] = customer_stats['orders'] / customer_stats['months_fixed']

    print(f"\n{period_name}:")
    print(f"  Total orders: {customer_stats['orders'].sum():,}")
    print(f"  Total customers: {len(customer_stats):,}")
    print()
    print(f"  METHOD 1 - BIASED (first-to-last span):")
    print(f"    Total customer-months: {customer_stats['months_biased'].sum():,.0f}")
    print(f"    Avg months per customer: {customer_stats['months_biased'].mean():.2f}")
    print(f"    AGGREGATE Frequency: {customer_stats['orders'].sum() / customer_stats['months_biased'].sum():.3f} orders/month")
    print(f"    MEAN Frequency: {customer_stats['freq_biased'].mean():.3f} orders/month")
    print(f"    MEDIAN Frequency: {customer_stats['freq_biased'].median():.3f} orders/month")
    print()
    print(f"  METHOD 2 - UNBIASED (fixed {customer_stats['months_fixed'].iloc[0]:.1f} months for all):")
    print(f"    Total customer-months: {customer_stats['months_fixed'].sum():,.0f}")
    print(f"    AGGREGATE Frequency: {customer_stats['orders'].sum() / customer_stats['months_fixed'].sum():.3f} orders/month")
    print(f"    MEAN Frequency: {customer_stats['freq_unbiased'].mean():.3f} orders/month")
    print(f"    MEDIAN Frequency: {customer_stats['freq_unbiased'].median():.3f} orders/month")

    # Show distribution of biased frequency
    print()
    print(f"  BIAS CHECK - Distribution of per-customer frequency (biased method):")
    print(f"    Min: {customer_stats['freq_biased'].min():.3f}")
    print(f"    25th percentile: {customer_stats['freq_biased'].quantile(0.25):.3f}")
    print(f"    50th percentile (median): {customer_stats['freq_biased'].median():.3f}")
    print(f"    75th percentile: {customer_stats['freq_biased'].quantile(0.75):.3f}")
    print(f"    Max: {customer_stats['freq_biased'].max():.3f}")
    print(f"    Customers with freq > 1.0: {(customer_stats['freq_biased'] > 1.0).sum():,} ({(customer_stats['freq_biased'] > 1.0).mean()*100:.1f}%)")

    return customer_stats

def main():
    print("="*70)
    print("FREQUENCY CALCULATION VERIFICATION")
    print("="*70)

    # Load data
    order_history = load_order_history()

    # Find robust sample
    robust_sample, before_orders, after_orders = find_robust_sample(order_history)

    # Calculate periods
    before_start = before_orders['COMPLETED_AT_DATE'].min()
    before_end = CLUB_LAUNCH_DATE - pd.Timedelta(days=1)
    before_months = (before_end - before_start).days / 30.44

    after_start = CLUB_LAUNCH_DATE
    after_end = after_orders['COMPLETED_AT_DATE'].max()
    after_months = (after_end - after_start).days / 30.44

    print(f"\nPeriod definitions:")
    print(f"  Before: {before_start.strftime('%Y-%m-%d')} to {before_end.strftime('%Y-%m-%d')} ({before_months:.1f} months)")
    print(f"  After: {after_start.strftime('%Y-%m-%d')} to {after_end.strftime('%Y-%m-%d')} ({after_months:.1f} months)")

    # Calculate frequency both ways
    print("\n" + "="*70)
    print("BEFORE CLUB PERIOD")
    print("="*70)
    before_stats = calculate_frequency_both_methods(
        before_orders, robust_sample, "BEFORE Club",
        period_months=before_months
    )

    print("\n" + "="*70)
    print("AFTER CLUB PERIOD")
    print("="*70)
    after_stats = calculate_frequency_both_methods(
        after_orders, robust_sample, "AFTER Club",
        period_months=after_months
    )

    # Summary comparison
    print("\n" + "="*70)
    print("SUMMARY COMPARISON")
    print("="*70)

    before_freq_biased = before_stats['orders'].sum() / before_stats['months_biased'].sum()
    after_freq_biased = after_stats['orders'].sum() / after_stats['months_biased'].sum()

    before_freq_unbiased = before_stats['orders'].sum() / before_stats['months_fixed'].sum()
    after_freq_unbiased = after_stats['orders'].sum() / after_stats['months_fixed'].sum()

    print(f"\nBIASED METHOD (current dashboard):")
    print(f"  Before: {before_freq_biased:.3f} orders/month")
    print(f"  After: {after_freq_biased:.3f} orders/month")
    print(f"  Change: {((after_freq_biased / before_freq_biased) - 1) * 100:+.1f}%")

    print(f"\nUNBIASED METHOD (fixed calendar period):")
    print(f"  Before: {before_freq_unbiased:.3f} orders/month")
    print(f"  After: {after_freq_unbiased:.3f} orders/month")
    print(f"  Change: {((after_freq_unbiased / before_freq_unbiased) - 1) * 100:+.1f}%")

    print(f"\nCONCLUSION:")
    print(f"  Biased frequency is ~{before_freq_biased / before_freq_unbiased:.1f}x higher than unbiased")
    print(f"  The RELATIVE CHANGE should be similar between methods")
    print(f"  Biased change: {((after_freq_biased / before_freq_biased) - 1) * 100:+.1f}%")
    print(f"  Unbiased change: {((after_freq_unbiased / before_freq_unbiased) - 1) * 100:+.1f}%")

if __name__ == "__main__":
    main()
