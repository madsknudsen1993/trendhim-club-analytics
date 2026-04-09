#!/usr/bin/env python3
"""
Analyze Shipping Revenue Before vs After Club

This script calculates shipping revenue changes for Best Customers and Medium Customers
to show the impact of the lower shipping threshold for Club members.

Output: Shipping revenue per order and monthly shipping revenue per customer
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

    # Convert shipping to numeric
    order_history['SHIPPING_GROSS_AMOUNT_DKK'] = pd.to_numeric(
        order_history['SHIPPING_GROSS_AMOUNT_DKK'], errors='coerce'
    ).fillna(0)

    print(f"Total orders: {len(order_history):,}")
    print(f"Date range: {order_history['COMPLETED_AT_DATE'].min()} to {order_history['COMPLETED_AT_DATE'].max()}")
    print(f"Shipping revenue range: {order_history['SHIPPING_GROSS_AMOUNT_DKK'].min():.2f} to {order_history['SHIPPING_GROSS_AMOUNT_DKK'].max():.2f} DKK")

    return order_history

def analyze_robust_sample_shipping(order_history):
    """
    Analyze shipping revenue for Robust Sample (Best Customers):
    - 2+ orders in BOTH before/after periods
    - 60+ days span in BOTH periods
    """
    print("\n" + "="*70)
    print("SHIPPING & ORDER SIZE: ROBUST SAMPLE (Best Customers)")
    print("="*70)

    # Define periods
    before_df = order_history[order_history['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = order_history[order_history['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Get date ranges for calendar months
    before_start = before_df['COMPLETED_AT_DATE'].min()
    after_end = after_df['COMPLETED_AT_DATE'].max()
    before_calendar_months = (CLUB_LAUNCH_DATE - before_start).days / 30.44
    after_calendar_months = (after_end - CLUB_LAUNCH_DATE).days / 30.44

    # Find customers with 2+ orders AND 60+ days span in EACH period
    before_stats = before_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max'],
        'SHIPPING_GROSS_AMOUNT_DKK': ['sum', 'mean'],
        'PRODUCT_QUANTITY': 'mean'
    })
    before_stats.columns = ['orders', 'first_order', 'last_order', 'total_shipping', 'avg_shipping_per_order', 'avg_items_per_order']
    before_stats['days_span'] = (before_stats['last_order'] - before_stats['first_order']).dt.days

    after_stats = after_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max'],
        'SHIPPING_GROSS_AMOUNT_DKK': ['sum', 'mean'],
        'PRODUCT_QUANTITY': 'mean'
    })
    after_stats.columns = ['orders', 'first_order', 'last_order', 'total_shipping', 'avg_shipping_per_order', 'avg_items_per_order']
    after_stats['days_span'] = (after_stats['last_order'] - after_stats['first_order']).dt.days

    # Filter: 2+ orders AND 60+ days span
    qualified_before = set(before_stats[(before_stats['orders'] >= 2) & (before_stats['days_span'] >= 60)].index)
    qualified_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days_span'] >= 60)].index)
    robust_sample = qualified_before & qualified_after

    print(f"\nSample Size: {len(robust_sample):,} customers")

    # Filter to robust sample
    before_robust = before_stats.loc[list(robust_sample)]
    after_robust = after_stats.loc[list(robust_sample)]

    # Calculate metrics
    total_orders_before = before_robust['orders'].sum()
    total_orders_after = after_robust['orders'].sum()

    total_customer_months_before = len(robust_sample) * before_calendar_months
    total_customer_months_after = len(robust_sample) * after_calendar_months

    freq_before = total_orders_before / total_customer_months_before
    freq_after = total_orders_after / total_customer_months_after

    # Shipping metrics
    avg_shipping_before = before_robust['avg_shipping_per_order'].mean()
    avg_shipping_after = after_robust['avg_shipping_per_order'].mean()
    shipping_change_pct = ((avg_shipping_after / avg_shipping_before) - 1) * 100

    # Items per order metrics
    avg_items_before = before_robust['avg_items_per_order'].mean()
    avg_items_after = after_robust['avg_items_per_order'].mean()
    items_change_pct = ((avg_items_after / avg_items_before) - 1) * 100

    # Monthly metrics per customer
    monthly_shipping_before = freq_before * avg_shipping_before
    monthly_shipping_after = freq_after * avg_shipping_after
    monthly_shipping_change = monthly_shipping_after - monthly_shipping_before

    monthly_items_before = freq_before * avg_items_before
    monthly_items_after = freq_after * avg_items_after
    monthly_items_change = monthly_items_after - monthly_items_before

    print(f"\n📊 BEFORE Club:")
    print(f"   Avg Items/Order: {avg_items_before:.2f}")
    print(f"   Avg Shipping/Order: {avg_shipping_before:.2f} DKK")
    print(f"   Frequency: {freq_before:.3f} orders/mo")
    print(f"   Monthly Items: {monthly_items_before:.2f} items/customer/mo")
    print(f"   Monthly Shipping Revenue: {monthly_shipping_before:.2f} DKK/customer/mo")

    print(f"\n📊 AFTER Club:")
    print(f"   Avg Items/Order: {avg_items_after:.2f}")
    print(f"   Avg Shipping/Order: {avg_shipping_after:.2f} DKK")
    print(f"   Frequency: {freq_after:.3f} orders/mo")
    print(f"   Monthly Items: {monthly_items_after:.2f} items/customer/mo")
    print(f"   Monthly Shipping Revenue: {monthly_shipping_after:.2f} DKK/customer/mo")

    print(f"\n📈 CHANGES:")
    print(f"   Items/Order: {items_change_pct:+.1f}%")
    print(f"   Shipping/Order: {shipping_change_pct:+.1f}%")
    print(f"   Frequency: {((freq_after/freq_before)-1)*100:+.1f}%")
    print(f"   Monthly Items: {monthly_items_change:+.2f} items/customer/mo ({((monthly_items_after/monthly_items_before)-1)*100:+.1f}%)")
    print(f"   Monthly Shipping: {monthly_shipping_change:+.2f} DKK/customer/mo")

    return {
        'sample_size': len(robust_sample),
        'before': {
            'avg_items_per_order': round(avg_items_before, 2),
            'avg_shipping_per_order': round(avg_shipping_before, 2),
            'frequency': round(freq_before, 3),
            'monthly_items': round(monthly_items_before, 2),
            'monthly_shipping': round(monthly_shipping_before, 2),
        },
        'after': {
            'avg_items_per_order': round(avg_items_after, 2),
            'avg_shipping_per_order': round(avg_shipping_after, 2),
            'frequency': round(freq_after, 3),
            'monthly_items': round(monthly_items_after, 2),
            'monthly_shipping': round(monthly_shipping_after, 2),
        },
        'changes': {
            'items_per_order_pct': round(items_change_pct, 1),
            'shipping_per_order_pct': round(shipping_change_pct, 1),
            'monthly_items_change': round(monthly_items_change, 2),
            'monthly_shipping_change': round(monthly_shipping_change, 2),
        }
    }

def analyze_broader_sample_shipping(order_history):
    """
    Analyze shipping revenue for Broader Sample (Medium Customers):
    - 1+ order BEFORE
    - 60+ days span AND 2+ orders AFTER
    """
    print("\n" + "="*70)
    print("SHIPPING & ORDER SIZE: BROADER SAMPLE (Medium Customers)")
    print("="*70)

    # Define periods
    before_df = order_history[order_history['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = order_history[order_history['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Get date ranges for calendar months
    before_start = before_df['COMPLETED_AT_DATE'].min()
    after_end = after_df['COMPLETED_AT_DATE'].max()
    before_calendar_months = (CLUB_LAUNCH_DATE - before_start).days / 30.44
    after_calendar_months = (after_end - CLUB_LAUNCH_DATE).days / 30.44

    # Find customers matching criteria
    before_stats = before_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'SHIPPING_GROSS_AMOUNT_DKK': ['sum', 'mean'],
        'PRODUCT_QUANTITY': 'mean'
    })
    before_stats.columns = ['orders', 'total_shipping', 'avg_shipping_per_order', 'avg_items_per_order']

    after_stats = after_df.groupby('UNIQUE_CUSTOMER_ID').agg({
        'ORDER_NUMBER': 'count',
        'COMPLETED_AT_DATE': ['min', 'max'],
        'SHIPPING_GROSS_AMOUNT_DKK': ['sum', 'mean'],
        'PRODUCT_QUANTITY': 'mean'
    })
    after_stats.columns = ['orders', 'first_order', 'last_order', 'total_shipping', 'avg_shipping_per_order', 'avg_items_per_order']
    after_stats['days_span'] = (after_stats['last_order'] - after_stats['first_order']).dt.days

    # Filter: 1+ before AND (2+ orders AND 60+ days span) after
    qualified_before = set(before_stats[before_stats['orders'] >= 1].index)
    qualified_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days_span'] >= 60)].index)
    broader_sample = qualified_before & qualified_after

    print(f"\nSample Size: {len(broader_sample):,} customers")

    # Filter to broader sample
    before_broader = before_stats.loc[list(broader_sample)]
    after_broader = after_stats.loc[list(broader_sample)]

    # Calculate metrics
    total_orders_before = before_broader['orders'].sum()
    total_orders_after = after_broader['orders'].sum()

    total_customer_months_before = len(broader_sample) * before_calendar_months
    total_customer_months_after = len(broader_sample) * after_calendar_months

    freq_before = total_orders_before / total_customer_months_before
    freq_after = total_orders_after / total_customer_months_after

    # Shipping metrics
    avg_shipping_before = before_broader['avg_shipping_per_order'].mean()
    avg_shipping_after = after_broader['avg_shipping_per_order'].mean()
    shipping_change_pct = ((avg_shipping_after / avg_shipping_before) - 1) * 100

    # Items per order metrics
    avg_items_before = before_broader['avg_items_per_order'].mean()
    avg_items_after = after_broader['avg_items_per_order'].mean()
    items_change_pct = ((avg_items_after / avg_items_before) - 1) * 100

    # Monthly metrics per customer
    monthly_shipping_before = freq_before * avg_shipping_before
    monthly_shipping_after = freq_after * avg_shipping_after
    monthly_shipping_change = monthly_shipping_after - monthly_shipping_before

    monthly_items_before = freq_before * avg_items_before
    monthly_items_after = freq_after * avg_items_after
    monthly_items_change = monthly_items_after - monthly_items_before

    print(f"\n📊 BEFORE Club:")
    print(f"   Avg Items/Order: {avg_items_before:.2f}")
    print(f"   Avg Shipping/Order: {avg_shipping_before:.2f} DKK")
    print(f"   Frequency: {freq_before:.3f} orders/mo")
    print(f"   Monthly Items: {monthly_items_before:.2f} items/customer/mo")
    print(f"   Monthly Shipping Revenue: {monthly_shipping_before:.2f} DKK/customer/mo")

    print(f"\n📊 AFTER Club:")
    print(f"   Avg Items/Order: {avg_items_after:.2f}")
    print(f"   Avg Shipping/Order: {avg_shipping_after:.2f} DKK")
    print(f"   Frequency: {freq_after:.3f} orders/mo")
    print(f"   Monthly Items: {monthly_items_after:.2f} items/customer/mo")
    print(f"   Monthly Shipping Revenue: {monthly_shipping_after:.2f} DKK/customer/mo")

    print(f"\n📈 CHANGES:")
    print(f"   Items/Order: {items_change_pct:+.1f}%")
    print(f"   Shipping/Order: {shipping_change_pct:+.1f}%")
    print(f"   Frequency: {((freq_after/freq_before)-1)*100:+.1f}%")
    print(f"   Monthly Items: {monthly_items_change:+.2f} items/customer/mo ({((monthly_items_after/monthly_items_before)-1)*100:+.1f}%)")
    print(f"   Monthly Shipping: {monthly_shipping_change:+.2f} DKK/customer/mo")

    return {
        'sample_size': len(broader_sample),
        'before': {
            'avg_items_per_order': round(avg_items_before, 2),
            'avg_shipping_per_order': round(avg_shipping_before, 2),
            'frequency': round(freq_before, 3),
            'monthly_items': round(monthly_items_before, 2),
            'monthly_shipping': round(monthly_shipping_before, 2),
        },
        'after': {
            'avg_items_per_order': round(avg_items_after, 2),
            'avg_shipping_per_order': round(avg_shipping_after, 2),
            'frequency': round(freq_after, 3),
            'monthly_items': round(monthly_items_after, 2),
            'monthly_shipping': round(monthly_shipping_after, 2),
        },
        'changes': {
            'items_per_order_pct': round(items_change_pct, 1),
            'shipping_per_order_pct': round(shipping_change_pct, 1),
            'monthly_items_change': round(monthly_items_change, 2),
            'monthly_shipping_change': round(monthly_shipping_change, 2),
        }
    }

def main():
    order_history = load_order_history()

    robust_results = analyze_robust_sample_shipping(order_history)
    broader_results = analyze_broader_sample_shipping(order_history)

    print("\n" + "="*70)
    print("SUMMARY: SHIPPING & ORDER SIZE IMPACT")
    print("="*70)

    print("\n┌──────────────────────────────────────────────────────────────────────────┐")
    print("│ BEST CUSTOMERS (Robust Sample) - {:,} customers                        │".format(robust_results['sample_size']))
    print("├──────────────────────────────────────────────────────────────────────────┤")
    print(f"│ Items/Order:     Before {robust_results['before']['avg_items_per_order']:>5.2f}     → After {robust_results['after']['avg_items_per_order']:>5.2f}     ({robust_results['changes']['items_per_order_pct']:+.1f}%)       │")
    print(f"│ Shipping/Order:  Before {robust_results['before']['avg_shipping_per_order']:>5.2f} DKK → After {robust_results['after']['avg_shipping_per_order']:>5.2f} DKK ({robust_results['changes']['shipping_per_order_pct']:+.1f}%)       │")
    print("├──────────────────────────────────────────────────────────────────────────┤")
    print(f"│ Monthly Items:    {robust_results['before']['monthly_items']:>5.2f} → {robust_results['after']['monthly_items']:>5.2f} items/mo   ({robust_results['changes']['monthly_items_change']:+.2f})                │")
    print(f"│ Monthly Shipping: {robust_results['before']['monthly_shipping']:>5.2f} → {robust_results['after']['monthly_shipping']:>5.2f} DKK/mo     ({robust_results['changes']['monthly_shipping_change']:+.2f})                │")
    print("└──────────────────────────────────────────────────────────────────────────┘")

    print("\n┌──────────────────────────────────────────────────────────────────────────┐")
    print("│ MEDIUM CUSTOMERS (Broader Sample) - {:,} customers                     │".format(broader_results['sample_size']))
    print("├──────────────────────────────────────────────────────────────────────────┤")
    print(f"│ Items/Order:     Before {broader_results['before']['avg_items_per_order']:>5.2f}     → After {broader_results['after']['avg_items_per_order']:>5.2f}     ({broader_results['changes']['items_per_order_pct']:+.1f}%)       │")
    print(f"│ Shipping/Order:  Before {broader_results['before']['avg_shipping_per_order']:>5.2f} DKK → After {broader_results['after']['avg_shipping_per_order']:>5.2f} DKK ({broader_results['changes']['shipping_per_order_pct']:+.1f}%)       │")
    print("├──────────────────────────────────────────────────────────────────────────┤")
    print(f"│ Monthly Items:    {broader_results['before']['monthly_items']:>5.2f} → {broader_results['after']['monthly_items']:>5.2f} items/mo   ({broader_results['changes']['monthly_items_change']:+.2f})                │")
    print(f"│ Monthly Shipping: {broader_results['before']['monthly_shipping']:>5.2f} → {broader_results['after']['monthly_shipping']:>5.2f} DKK/mo     ({broader_results['changes']['monthly_shipping_change']:+.2f})                │")
    print("└──────────────────────────────────────────────────────────────────────────┘")

    # Interpretation
    print("\n" + "="*70)
    print("INTERPRETATION")
    print("="*70)

    best_items_change = robust_results['changes']['items_per_order_pct']
    medium_items_change = broader_results['changes']['items_per_order_pct']

    if best_items_change < 0 or medium_items_change < 0:
        print("\n✓ HYPOTHESIS SUPPORTED: Club members buy FEWER items per order")
        print(f"  - Best Customers: {best_items_change:+.1f}% items/order")
        print(f"  - Medium Customers: {medium_items_change:+.1f}% items/order")
        print("\n  This explains the shipping increase: smaller orders = more orders below")
        print("  the free shipping threshold = more shipping revenue per order.")
    else:
        print("\n✗ HYPOTHESIS NOT SUPPORTED: Items per order did not decrease")
        print(f"  - Best Customers: {best_items_change:+.1f}% items/order")
        print(f"  - Medium Customers: {medium_items_change:+.1f}% items/order")

    print("\n" + "="*70)
    print("VALUES FOR data-source.tsx")
    print("="*70)

    print("\n// Best Customers - Order Size & Shipping")
    print("orderBehavior: {")
    print("  before: {")
    print(f"    itemsPerOrder: {robust_results['before']['avg_items_per_order']},")
    print(f"    shippingPerOrder: {robust_results['before']['avg_shipping_per_order']},")
    print(f"    monthlyItems: {robust_results['before']['monthly_items']},")
    print(f"    monthlyShipping: {robust_results['before']['monthly_shipping']},")
    print("  },")
    print("  after: {")
    print(f"    itemsPerOrder: {robust_results['after']['avg_items_per_order']},")
    print(f"    shippingPerOrder: {robust_results['after']['avg_shipping_per_order']},")
    print(f"    monthlyItems: {robust_results['after']['monthly_items']},")
    print(f"    monthlyShipping: {robust_results['after']['monthly_shipping']},")
    print("  },")
    print("  changes: {")
    print(f"    itemsPerOrderPct: {robust_results['changes']['items_per_order_pct']},")
    print(f"    shippingPerOrderPct: {robust_results['changes']['shipping_per_order_pct']},")
    print(f"    monthlyItemsChange: {robust_results['changes']['monthly_items_change']},")
    print(f"    monthlyShippingChange: {robust_results['changes']['monthly_shipping_change']},")
    print("  },")
    print("},")

    print("\n// Medium Customers - Order Size & Shipping")
    print("orderBehavior: {")
    print("  before: {")
    print(f"    itemsPerOrder: {broader_results['before']['avg_items_per_order']},")
    print(f"    shippingPerOrder: {broader_results['before']['avg_shipping_per_order']},")
    print(f"    monthlyItems: {broader_results['before']['monthly_items']},")
    print(f"    monthlyShipping: {broader_results['before']['monthly_shipping']},")
    print("  },")
    print("  after: {")
    print(f"    itemsPerOrder: {broader_results['after']['avg_items_per_order']},")
    print(f"    shippingPerOrder: {broader_results['after']['avg_shipping_per_order']},")
    print(f"    monthlyItems: {broader_results['after']['monthly_items']},")
    print(f"    monthlyShipping: {broader_results['after']['monthly_shipping']},")
    print("  },")
    print("  changes: {")
    print(f"    itemsPerOrderPct: {broader_results['changes']['items_per_order_pct']},")
    print(f"    shippingPerOrderPct: {broader_results['changes']['shipping_per_order_pct']},")
    print(f"    monthlyItemsChange: {broader_results['changes']['monthly_items_change']},")
    print(f"    monthlyShippingChange: {broader_results['changes']['monthly_shipping_change']},")
    print("  },")
    print("},")

if __name__ == "__main__":
    main()
