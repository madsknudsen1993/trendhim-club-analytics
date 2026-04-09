#!/usr/bin/env python3
"""
Recalculate Frequency Using UNBIASED Method

This script recalculates all frequency-related metrics using the correct
unbiased method (fixed calendar periods instead of first-to-last span).

Output: Exact values to update in data-source.tsx
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Configuration
ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")

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

def analyze_robust_sample(order_history):
    """
    Analyze the Robust Sample (Best Customers):
    - 2+ orders in BOTH before/after periods
    - 60+ days span in BOTH periods
    """
    print("\n" + "="*70)
    print("ROBUST SAMPLE (Best Customers) - UNBIASED CALCULATION")
    print("="*70)

    # Define periods
    before_df = order_history[order_history['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = order_history[order_history['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Get the actual date ranges
    before_start = before_df['COMPLETED_AT_DATE'].min()
    before_end = before_df['COMPLETED_AT_DATE'].max()
    after_start = after_df['COMPLETED_AT_DATE'].min()
    after_end = after_df['COMPLETED_AT_DATE'].max()

    # Calculate calendar months for each period
    before_calendar_months = (CLUB_LAUNCH_DATE - before_start).days / 30.44
    after_calendar_months = (after_end - CLUB_LAUNCH_DATE).days / 30.44

    print(f"\nPeriod Definitions:")
    print(f"  Before: {before_start.strftime('%Y-%m-%d')} to {(CLUB_LAUNCH_DATE - pd.Timedelta(days=1)).strftime('%Y-%m-%d')}")
    print(f"          Calendar months: {before_calendar_months:.2f}")
    print(f"  After:  {CLUB_LAUNCH_DATE.strftime('%Y-%m-%d')} to {after_end.strftime('%Y-%m-%d')}")
    print(f"          Calendar months: {after_calendar_months:.2f}")

    # Find customers with 2+ orders AND 60+ days span in EACH period
    before_stats = before_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max'],
        'GROSS_AMOUNT_DKK': 'mean',
        'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean'
    })
    before_stats.columns = ['orders', 'first_order', 'last_order', 'aov', 'profit_per_order']
    before_stats['days_span'] = (before_stats['last_order'] - before_stats['first_order']).dt.days

    after_stats = after_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max'],
        'GROSS_AMOUNT_DKK': 'mean',
        'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean'
    })
    after_stats.columns = ['orders', 'first_order', 'last_order', 'aov', 'profit_per_order']
    after_stats['days_span'] = (after_stats['last_order'] - after_stats['first_order']).dt.days

    # Filter: 2+ orders AND 60+ days span
    qualified_before = set(before_stats[(before_stats['orders'] >= 2) & (before_stats['days_span'] >= 60)].index)
    qualified_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days_span'] >= 60)].index)
    robust_sample = qualified_before & qualified_after

    print(f"\nSample Selection:")
    print(f"  Qualified before (2+ orders, 60+ days): {len(qualified_before):,}")
    print(f"  Qualified after (2+ orders, 60+ days): {len(qualified_after):,}")
    print(f"  ROBUST SAMPLE (both): {len(robust_sample):,}")

    # Filter to robust sample
    before_robust = before_stats.loc[list(robust_sample)]
    after_robust = after_stats.loc[list(robust_sample)]

    # Calculate UNBIASED frequency (using calendar months)
    total_orders_before = before_robust['orders'].sum()
    total_orders_after = after_robust['orders'].sum()

    total_customer_months_before = len(robust_sample) * before_calendar_months
    total_customer_months_after = len(robust_sample) * after_calendar_months

    freq_before = total_orders_before / total_customer_months_before
    freq_after = total_orders_after / total_customer_months_after
    freq_change_pct = ((freq_after / freq_before) - 1) * 100

    # Calculate other metrics
    aov_before = before_robust['aov'].mean()
    aov_after = after_robust['aov'].mean()
    profit_before = before_robust['profit_per_order'].mean()
    profit_after = after_robust['profit_per_order'].mean()

    # Monthly profit per customer
    monthly_profit_before = freq_before * profit_before
    monthly_profit_after = freq_after * profit_after
    monthly_profit_change = ((monthly_profit_after / monthly_profit_before) - 1) * 100
    incremental_monthly = monthly_profit_after - monthly_profit_before

    print("\n" + "-"*70)
    print("RESULTS: ROBUST SAMPLE (Best Customers)")
    print("-"*70)

    print(f"\nSample Size: {len(robust_sample):,} customers")

    print(f"\n📊 BEFORE Club:")
    print(f"   Total Orders: {total_orders_before:,}")
    print(f"   Customer-Months: {total_customer_months_before:,.0f}")
    print(f"   Frequency: {freq_before:.3f} orders/customer/month")
    print(f"   Avg Order Value: {aov_before:.2f} DKK")
    print(f"   Profit per Order: {profit_before:.2f} DKK")
    print(f"   Monthly Profit: {monthly_profit_before:.2f} DKK/customer/month")

    print(f"\n📊 AFTER Club:")
    print(f"   Total Orders: {total_orders_after:,}")
    print(f"   Customer-Months: {total_customer_months_after:,.0f}")
    print(f"   Frequency: {freq_after:.3f} orders/customer/month")
    print(f"   Avg Order Value: {aov_after:.2f} DKK")
    print(f"   Profit per Order: {profit_after:.2f} DKK")
    print(f"   Monthly Profit: {monthly_profit_after:.2f} DKK/customer/month")

    print(f"\n📈 CHANGES:")
    print(f"   Frequency: {freq_change_pct:+.1f}%")
    print(f"   AOV: {((aov_after/aov_before)-1)*100:+.1f}%")
    print(f"   Profit/Order: {((profit_after/profit_before)-1)*100:+.1f}%")
    print(f"   Monthly Profit: {monthly_profit_change:+.1f}%")
    print(f"   Incremental Monthly Value: {incremental_monthly:+.2f} DKK/customer/month")

    return {
        'sample_size': len(robust_sample),
        'before': {
            'total_orders': int(total_orders_before),
            'customer_months': round(total_customer_months_before, 0),
            'frequency': round(freq_before, 3),
            'aov': round(aov_before, 2),
            'profit_per_order': round(profit_before, 2),
            'monthly_profit': round(monthly_profit_before, 2),
        },
        'after': {
            'total_orders': int(total_orders_after),
            'customer_months': round(total_customer_months_after, 0),
            'frequency': round(freq_after, 3),
            'aov': round(aov_after, 2),
            'profit_per_order': round(profit_after, 2),
            'monthly_profit': round(monthly_profit_after, 2),
        },
        'changes': {
            'frequency_pct': round(freq_change_pct, 1),
            'aov_pct': round(((aov_after/aov_before)-1)*100, 1),
            'profit_per_order_pct': round(((profit_after/profit_before)-1)*100, 1),
            'monthly_profit_pct': round(monthly_profit_change, 1),
            'incremental_monthly': round(incremental_monthly, 2),
        },
        'calendar_months': {
            'before': round(before_calendar_months, 2),
            'after': round(after_calendar_months, 2),
        }
    }

def analyze_broader_sample(order_history):
    """
    Analyze the Broader Sample (Medium Customers):
    - 1+ order BEFORE
    - 60+ days span AND 2+ orders AFTER (same criteria as original)
    """
    print("\n" + "="*70)
    print("BROADER SAMPLE (Medium Customers) - UNBIASED CALCULATION")
    print("="*70)

    # Define periods
    before_df = order_history[order_history['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = order_history[order_history['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Get the actual date ranges
    before_start = before_df['COMPLETED_AT_DATE'].min()
    after_end = after_df['COMPLETED_AT_DATE'].max()

    # Calculate calendar months
    before_calendar_months = (CLUB_LAUNCH_DATE - before_start).days / 30.44
    after_calendar_months = (after_end - CLUB_LAUNCH_DATE).days / 30.44

    # Find customers with 1+ order before AND (60+ days span AND 2+ orders) after
    before_stats = before_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'GROSS_AMOUNT_DKK': 'mean',
        'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean'
    })
    before_stats.columns = ['orders', 'aov', 'profit_per_order']

    after_stats = after_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max'],
        'GROSS_AMOUNT_DKK': 'mean',
        'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean'
    })
    after_stats.columns = ['orders', 'first_order', 'last_order', 'aov', 'profit_per_order']
    after_stats['days_span'] = (after_stats['last_order'] - after_stats['first_order']).dt.days

    # Filter: 1+ before AND (2+ orders AND 60+ days span) after - SAME AS ORIGINAL
    qualified_before = set(before_stats[before_stats['orders'] >= 1].index)
    qualified_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days_span'] >= 60)].index)
    broader_sample = qualified_before & qualified_after

    print(f"\nSample Selection:")
    print(f"  1+ orders before: {len(qualified_before):,}")
    print(f"  2+ orders AND 60+ days after: {len(qualified_after):,}")
    print(f"  BROADER SAMPLE (both): {len(broader_sample):,}")

    # Count multi-order vs single-order before
    multi_order_before = len([c for c in broader_sample if before_stats.loc[c, 'orders'] >= 2])
    single_order_before = len(broader_sample) - multi_order_before

    print(f"    - Multi-order before (2+): {multi_order_before:,}")
    print(f"    - Single-order before (1): {single_order_before:,}")

    # Filter to broader sample
    before_broader = before_stats.loc[list(broader_sample)]
    after_broader = after_stats.loc[list(broader_sample)]

    # Calculate UNBIASED frequency
    total_orders_before = before_broader['orders'].sum()
    total_orders_after = after_broader['orders'].sum()

    total_customer_months_before = len(broader_sample) * before_calendar_months
    total_customer_months_after = len(broader_sample) * after_calendar_months

    freq_before = total_orders_before / total_customer_months_before
    freq_after = total_orders_after / total_customer_months_after
    freq_change_pct = ((freq_after / freq_before) - 1) * 100

    # Calculate other metrics
    aov_before = before_broader['aov'].mean()
    aov_after = after_broader['aov'].mean()
    profit_before = before_broader['profit_per_order'].mean()
    profit_after = after_broader['profit_per_order'].mean()

    # Monthly profit per customer
    monthly_profit_before = freq_before * profit_before
    monthly_profit_after = freq_after * profit_after
    monthly_profit_change = ((monthly_profit_after / monthly_profit_before) - 1) * 100
    incremental_monthly = monthly_profit_after - monthly_profit_before

    print(f"\n📊 BEFORE Club:")
    print(f"   Total Orders: {total_orders_before:,}")
    print(f"   Customer-Months: {total_customer_months_before:,.0f}")
    print(f"   Frequency: {freq_before:.3f} orders/customer/month")
    print(f"   Avg Order Value: {aov_before:.2f} DKK")
    print(f"   Profit per Order: {profit_before:.2f} DKK")
    print(f"   Monthly Profit: {monthly_profit_before:.2f} DKK/customer/month")

    print(f"\n📊 AFTER Club:")
    print(f"   Total Orders: {total_orders_after:,}")
    print(f"   Customer-Months: {total_customer_months_after:,.0f}")
    print(f"   Frequency: {freq_after:.3f} orders/customer/month")
    print(f"   Avg Order Value: {aov_after:.2f} DKK")
    print(f"   Profit per Order: {profit_after:.2f} DKK")
    print(f"   Monthly Profit: {monthly_profit_after:.2f} DKK/customer/month")

    print(f"\n📈 CHANGES:")
    print(f"   Frequency: {freq_change_pct:+.1f}%")
    print(f"   AOV: {((aov_after/aov_before)-1)*100:+.1f}%")
    print(f"   Profit/Order: {((profit_after/profit_before)-1)*100:+.1f}%")
    print(f"   Monthly Profit: {monthly_profit_change:+.1f}%")
    print(f"   Incremental Monthly Value: {incremental_monthly:+.2f} DKK/customer/month")

    return {
        'sample_size': len(broader_sample),
        'multi_order_before': multi_order_before,
        'single_order_before': single_order_before,
        'before': {
            'total_orders': int(total_orders_before),
            'customer_months': round(total_customer_months_before, 0),
            'frequency': round(freq_before, 3),
            'aov': round(aov_before, 2),
            'profit_per_order': round(profit_before, 2),
            'monthly_profit': round(monthly_profit_before, 2),
        },
        'after': {
            'total_orders': int(total_orders_after),
            'customer_months': round(total_customer_months_after, 0),
            'frequency': round(freq_after, 3),
            'aov': round(aov_after, 2),
            'profit_per_order': round(profit_after, 2),
            'monthly_profit': round(monthly_profit_after, 2),
        },
        'changes': {
            'frequency_pct': round(freq_change_pct, 1),
            'aov_pct': round(((aov_after/aov_before)-1)*100, 1),
            'profit_per_order_pct': round(((profit_after/profit_before)-1)*100, 1),
            'monthly_profit_pct': round(monthly_profit_change, 1),
            'incremental_monthly': round(incremental_monthly, 2),
        }
    }

def main():
    order_history = load_order_history()

    robust_results = analyze_robust_sample(order_history)
    broader_results = analyze_broader_sample(order_history)

    print("\n" + "="*70)
    print("VALUES TO UPDATE IN data-source.tsx")
    print("="*70)

    print("\n// ROBUST SAMPLE (Best Customers)")
    print(f"robustSampleSize: {robust_results['sample_size']},")
    print(f"calendarMonthsBefore: {robust_results['calendar_months']['before']},")
    print(f"calendarMonthsAfter: {robust_results['calendar_months']['after']},")
    print("\nbefore: {")
    print(f"  totalOrders: {robust_results['before']['total_orders']},")
    print(f"  totalCustomerMonths: {int(robust_results['before']['customer_months'])},")
    print(f"  frequency: {robust_results['before']['frequency']},")
    print(f"  avgOrderValue: {robust_results['before']['aov']},")
    print(f"  profitPerOrder: {robust_results['before']['profit_per_order']},")
    print(f"  monthlyProfit: {robust_results['before']['monthly_profit']},")
    print("},")
    print("\nafter: {")
    print(f"  totalOrders: {robust_results['after']['total_orders']},")
    print(f"  totalCustomerMonths: {int(robust_results['after']['customer_months'])},")
    print(f"  frequency: {robust_results['after']['frequency']},")
    print(f"  avgOrderValue: {robust_results['after']['aov']},")
    print(f"  profitPerOrder: {robust_results['after']['profit_per_order']},")
    print(f"  monthlyProfit: {robust_results['after']['monthly_profit']},")
    print("},")
    print("\nchanges: {")
    print(f"  frequencyChange: {robust_results['changes']['frequency_pct']},")
    print(f"  aovChange: {robust_results['changes']['aov_pct']},")
    print(f"  profitPerOrderChange: {robust_results['changes']['profit_per_order_pct']},")
    print(f"  monthlyProfitChange: {robust_results['changes']['monthly_profit_pct']},")
    print(f"  incrementalMonthlyValue: {robust_results['changes']['incremental_monthly']},")
    print("},")

    print("\n// BROADER SAMPLE (Medium Customers)")
    print(f"sampleSize: {broader_results['sample_size']},")
    print(f"multiOrderBefore: {broader_results['multi_order_before']},")
    print(f"singleOrderBefore: {broader_results['single_order_before']},")
    print("\nbefore: {")
    print(f"  totalOrders: {broader_results['before']['total_orders']},")
    print(f"  totalCustomerMonths: {int(broader_results['before']['customer_months'])},")
    print(f"  frequency: {broader_results['before']['frequency']},")
    print(f"  avgOrderValue: {broader_results['before']['aov']},")
    print(f"  profitPerOrder: {broader_results['before']['profit_per_order']},")
    print(f"  monthlyProfit: {broader_results['before']['monthly_profit']},")
    print("},")
    print("\nafter: {")
    print(f"  totalOrders: {broader_results['after']['total_orders']},")
    print(f"  totalCustomerMonths: {int(broader_results['after']['customer_months'])},")
    print(f"  frequency: {broader_results['after']['frequency']},")
    print(f"  avgOrderValue: {broader_results['after']['aov']},")
    print(f"  profitPerOrder: {broader_results['after']['profit_per_order']},")
    print(f"  monthlyProfit: {broader_results['after']['monthly_profit']},")
    print("},")
    print("\nchanges: {")
    print(f"  frequencyChange: {broader_results['changes']['frequency_pct']},")
    print(f"  aovChange: {broader_results['changes']['aov_pct']},")
    print(f"  profitPerOrderChange: {broader_results['changes']['profit_per_order_pct']},")
    print(f"  monthlyProfitChange: {broader_results['changes']['monthly_profit_pct']},")
    print(f"  incrementalMonthlyValue: {broader_results['changes']['incremental_monthly']},")
    print("},")

if __name__ == "__main__":
    main()
