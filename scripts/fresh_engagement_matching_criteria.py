#!/usr/bin/env python3
"""
Fresh Customer Engagement Analysis - MATCHING FRESH_CUSTOMERS CRITERIA

This script analyzes purchase behavior for customers who:
1. Had their FIRST order in the "After" period (Apr 2025 - Nov 30, 2025)
2. Placed a 2nd order within 60 days (converters = 24,533)

Then segments converters by cashback usage to match the Fresh Customers card.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import timedelta

# Configuration
ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"

# Date boundaries - MATCHING fresh_customer_analysis.py
AFTER_START = pd.Timestamp("2025-04-01")
AFTER_END = pd.Timestamp("2026-01-31")
CONVERSION_WINDOW_DAYS = 60

# Observation cutoff = AFTER_END - 60 days = Nov 30, 2025
OBSERVATION_CUTOFF = AFTER_END - timedelta(days=CONVERSION_WINDOW_DAYS)


def load_orders():
    """Load order history."""
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

    # Standard filtering
    orders = orders[
        (orders['ORDER_STATE'] == 'Complete') &
        (orders['IS_INTERNAL_ORDER'] == False) &
        (orders['IS_ORDER_RESEND'] == False) &
        (orders['IS_AN_ORDER_EXCHANGE'] == False)
    ].copy()

    # CE order exclusion
    orders = orders[~orders['ORDER_NUMBER'].astype(str).str.startswith('CE')].copy()

    print(f"Valid orders after filtering: {len(orders):,}")
    return orders


def get_cashback_data():
    """Get cashback redemption data from database."""
    print("\nGetting cashback data from database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("""
        SELECT
            order_number,
            customer_id,
            balance_cents,
            recorded_at
        FROM customer_cashback
        WHERE order_number IS NOT NULL
        ORDER BY customer_id, recorded_at
    """)
    cashback_records = pd.DataFrame(cursor.fetchall())

    cursor.close()
    conn.close()

    if len(cashback_records) > 0:
        cashback_records['recorded_at'] = pd.to_datetime(cashback_records['recorded_at'])

        # balance_cents = cashback SPENT on this order
        # Assume it's already in DKK cents (as per previous analysis)
        cashback_records['redeemed_cents'] = cashback_records['balance_cents']
        cashback_records['redeemed_dkk'] = cashback_records['redeemed_cents'] / 100

        print(f"Cashback records: {len(cashback_records):,}")
        print(f"Records with cashback spent: {(cashback_records['redeemed_cents'] > 0).sum():,}")

    return cashback_records


def identify_fresh_converters(orders):
    """
    Identify fresh customers who converted within 60 days.
    EXACTLY matching fresh_customer_analysis.py criteria.
    """
    print(f"\n{'='*80}")
    print(f"IDENTIFYING FRESH CUSTOMERS (Matching Fresh Customer Card)")
    print(f"{'='*80}")
    print(f"First order window: {AFTER_START.date()} to {OBSERVATION_CUTOFF.date()}")
    print(f"Conversion window: 60 days")

    # Sort by customer and date
    orders = orders.sort_values(['UNIQUE_CUSTOMER_ID', 'COMPLETED_AT_DATE'])

    # Group by customer and get order history
    customer_orders = orders.groupby('UNIQUE_CUSTOMER_ID').agg({
        'COMPLETED_AT_DATE': list,
        'ORDER_NUMBER': list,
    }).reset_index()

    customer_orders['order_count'] = customer_orders['COMPLETED_AT_DATE'].apply(len)
    customer_orders['first_order_date'] = customer_orders['COMPLETED_AT_DATE'].apply(lambda x: x[0])
    customer_orders['second_order_date'] = customer_orders['COMPLETED_AT_DATE'].apply(
        lambda x: x[1] if len(x) >= 2 else None
    )

    # Calculate days to second order
    customer_orders['days_to_second'] = customer_orders.apply(
        lambda row: (row['second_order_date'] - row['first_order_date']).days
        if row['second_order_date'] is not None else None,
        axis=1
    )

    # Flag if converted within 60 days
    customer_orders['converted_60d'] = customer_orders['days_to_second'].apply(
        lambda x: x is not None and x <= CONVERSION_WINDOW_DAYS
    )

    # Filter to FRESH customers: first order in the After period with observation window
    fresh_customers = customer_orders[
        (customer_orders['first_order_date'] >= AFTER_START) &
        (customer_orders['first_order_date'] <= OBSERVATION_CUTOFF)
    ].copy()

    total_fresh = len(fresh_customers)
    converters = fresh_customers[fresh_customers['converted_60d']]
    total_converters = len(converters)

    print(f"\nFresh customers (first order in period): {total_fresh:,}")
    print(f"Converters (2nd order within 60 days): {total_converters:,}")
    print(f"Conversion rate: {total_converters / total_fresh * 100:.2f}%")

    # Get all order numbers for converters (to check cashback usage)
    converter_all_orders = []
    for _, row in converters.iterrows():
        for order_num in row['ORDER_NUMBER']:
            converter_all_orders.append({
                'customer_id': row['UNIQUE_CUSTOMER_ID'],
                'order_number': order_num
            })

    converter_orders_df = pd.DataFrame(converter_all_orders)

    return fresh_customers, converters, converter_orders_df


def analyze_converter_cashback(converters, converter_orders_df, cashback_records):
    """
    Check which converters used cashback:
    1. On ANY order
    2. Specifically on their 2nd order
    """
    print(f"\n{'='*80}")
    print(f"CASHBACK ANALYSIS FOR CONVERTERS")
    print(f"{'='*80}")

    total_converters = len(converters)

    if len(cashback_records) == 0:
        print("No cashback records found!")
        return None

    # Find which converter orders have cashback redemption
    converter_order_numbers = set(converter_orders_df['order_number'])
    cb_on_converter_orders = cashback_records[
        (cashback_records['order_number'].isin(converter_order_numbers)) &
        (cashback_records['redeemed_cents'] > 0)
    ]

    # Count unique customers who used cashback ON ANY ORDER
    customers_with_cb_any = cb_on_converter_orders['customer_id'].nunique()
    orders_with_cb = cb_on_converter_orders['order_number'].nunique()
    total_cb_redeemed = cb_on_converter_orders['redeemed_dkk'].sum()

    cb_usage_rate_any = customers_with_cb_any / total_converters * 100 if total_converters > 0 else 0

    print(f"\n1. CASHBACK ON ANY ORDER:")
    print(f"   Converters: {total_converters:,}")
    print(f"   Used cashback on any order: {customers_with_cb_any:,} ({cb_usage_rate_any:.2f}%)")
    print(f"   Orders with cashback: {orders_with_cb:,}")
    print(f"   Total cashback redeemed: {total_cb_redeemed:,.0f} DKK")

    # Now check specifically for SECOND ORDER cashback
    # Get second order numbers for each converter
    second_order_numbers = set()
    for _, row in converters.iterrows():
        if len(row['ORDER_NUMBER']) >= 2:
            second_order_numbers.add(row['ORDER_NUMBER'][1])  # 2nd order

    cb_on_second_orders = cashback_records[
        (cashback_records['order_number'].isin(second_order_numbers)) &
        (cashback_records['redeemed_cents'] > 0)
    ]

    customers_with_cb_2nd = cb_on_second_orders['customer_id'].nunique()
    orders_with_cb_2nd = cb_on_second_orders['order_number'].nunique()
    total_cb_2nd = cb_on_second_orders['redeemed_dkk'].sum()

    cb_usage_rate_2nd = customers_with_cb_2nd / total_converters * 100 if total_converters > 0 else 0

    print(f"\n2. CASHBACK SPECIFICALLY ON 2ND ORDER:")
    print(f"   Converters: {total_converters:,}")
    print(f"   Used cashback on 2nd order: {customers_with_cb_2nd:,} ({cb_usage_rate_2nd:.2f}%)")
    print(f"   Total cashback on 2nd orders: {total_cb_2nd:,.0f} DKK")

    return {
        'total_converters': total_converters,
        'converters_with_cb_any': customers_with_cb_any,
        'cb_usage_rate_any': cb_usage_rate_any,
        'converters_with_cb_2nd': customers_with_cb_2nd,
        'cb_usage_rate_2nd': cb_usage_rate_2nd,
        'orders_with_cb': orders_with_cb,
        'total_cb_redeemed_any': total_cb_redeemed,
        'total_cb_redeemed_2nd': total_cb_2nd,
    }


def analyze_full_engagement_60d(orders, cashback_records, fresh_customers):
    """
    Full engagement analysis for fresh customers using 60-day order counting.
    Segments by: Used Cashback, Club (no CB), Non-Club

    Now includes PROFIT analysis per segment.

    This matches the FRESH_CUSTOMERS card criteria exactly.
    """
    print(f"\n{'='*80}")
    print(f"FRESH CUSTOMER ENGAGEMENT ANALYSIS (60-day order window)")
    print(f"{'='*80}")

    total_fresh = len(fresh_customers)
    print(f"Total fresh customers: {total_fresh:,}")

    # Get profit data for orders
    orders_with_profit = orders[['ORDER_NUMBER', 'PROFIT_TRACKING_TOTAL_PROFIT_DKK']].copy()
    orders_with_profit['PROFIT_TRACKING_TOTAL_PROFIT_DKK'] = pd.to_numeric(
        orders_with_profit['PROFIT_TRACKING_TOTAL_PROFIT_DKK'], errors='coerce'
    ).fillna(0)
    order_profit_map = dict(zip(orders_with_profit['ORDER_NUMBER'], orders_with_profit['PROFIT_TRACKING_TOTAL_PROFIT_DKK']))

    # Count orders within 60 days for each customer
    def count_orders_in_60d(row):
        first_date = row['first_order_date']
        window_end = first_date + timedelta(days=CONVERSION_WINDOW_DAYS)
        orders_in_window = [d for d in row['COMPLETED_AT_DATE'] if d <= window_end]
        return len(orders_in_window)

    fresh_customers = fresh_customers.copy()
    fresh_customers['orders_in_60d'] = fresh_customers.apply(count_orders_in_60d, axis=1)

    # Get all order numbers within 60-day window for each customer
    def get_orders_in_60d(row):
        first_date = row['first_order_date']
        window_end = first_date + timedelta(days=CONVERSION_WINDOW_DAYS)
        orders_in_window = []
        for i, d in enumerate(row['COMPLETED_AT_DATE']):
            if d <= window_end:
                orders_in_window.append(row['ORDER_NUMBER'][i])
        return orders_in_window

    fresh_customers['order_numbers_60d'] = fresh_customers.apply(get_orders_in_60d, axis=1)

    # Calculate total profit within 60-day window for each customer
    def get_total_profit_60d(row):
        total_profit = 0
        for order_num in row['order_numbers_60d']:
            total_profit += order_profit_map.get(order_num, 0)
        return total_profit

    fresh_customers['total_profit_60d'] = fresh_customers.apply(get_total_profit_60d, axis=1)

    # Get all 60-day order numbers
    all_60d_orders = set()
    for order_list in fresh_customers['order_numbers_60d']:
        all_60d_orders.update(order_list)

    print(f"Total orders within 60-day windows: {len(all_60d_orders):,}")

    # Create mapping: order_number -> UNIQUE_CUSTOMER_ID
    order_to_customer = {}
    for _, row in fresh_customers.iterrows():
        for order_num in row['order_numbers_60d']:
            order_to_customer[order_num] = row['UNIQUE_CUSTOMER_ID']

    # Find customers who used cashback (on any order within 60 days)
    # Use order_number to match since customer_id formats differ
    if len(cashback_records) > 0:
        cb_on_60d_orders = cashback_records[
            (cashback_records['order_number'].isin(all_60d_orders)) &
            (cashback_records['redeemed_cents'] > 0)
        ]
        # Map back to UNIQUE_CUSTOMER_ID through order numbers
        cb_order_numbers = cb_on_60d_orders['order_number'].unique()
        customers_with_cb = set(order_to_customer.get(on, None) for on in cb_order_numbers)
        customers_with_cb.discard(None)
    else:
        customers_with_cb = set()

    print(f"Customers who used cashback: {len(customers_with_cb):,}")

    # For Club segmentation: customers who have ANY order in cashback system are Club members
    # This is because only Club members can earn/use cashback
    if len(cashback_records) > 0:
        # Find all order numbers that appear in cashback system (even with 0 balance)
        all_cb_order_numbers = set(cashback_records['order_number'].unique())
        # Find which fresh customers have orders in the cashback system
        club_customer_ids = set()
        for _, row in fresh_customers.iterrows():
            for order_num in row['order_numbers_60d']:
                if order_num in all_cb_order_numbers:
                    club_customer_ids.add(row['UNIQUE_CUSTOMER_ID'])
                    break
        customers_with_club_order = club_customer_ids
    else:
        customers_with_club_order = set()

    print(f"Customers with Club association: {len(customers_with_club_order):,}")

    # Segment customers
    fresh_customer_ids = set(fresh_customers['UNIQUE_CUSTOMER_ID'])
    used_cb_ids = customers_with_cb.intersection(fresh_customer_ids)
    club_no_cb_ids = customers_with_club_order.intersection(fresh_customer_ids) - used_cb_ids
    non_club_ids = fresh_customer_ids - customers_with_club_order

    print(f"\nSegmentation:")
    print(f"  Used Cashback: {len(used_cb_ids):,}")
    print(f"  Club (no CB): {len(club_no_cb_ids):,}")
    print(f"  Non-Club: {len(non_club_ids):,}")
    print(f"  Total: {len(used_cb_ids) + len(club_no_cb_ids) + len(non_club_ids):,}")

    # Calculate stats for each segment
    def get_segment_stats(customer_ids, segment_name):
        segment = fresh_customers[fresh_customers['UNIQUE_CUSTOMER_ID'].isin(customer_ids)]
        n = len(segment)

        if n == 0:
            return None

        orders = segment['orders_in_60d']
        profits = segment['total_profit_60d']

        # Order distribution
        dist = []
        for o in range(1, 5):
            count = (orders == o).sum()
            pct = count / n * 100
            dist.append({'orders': o, 'count': count, 'pct': round(pct, 1)})

        # 5+ orders
        count_5plus = (orders >= 5).sum()
        pct_5plus = count_5plus / n * 100
        dist.append({'orders': '5+', 'count': count_5plus, 'pct': round(pct_5plus, 1)})

        # Profit calculations
        total_orders = orders.sum()
        total_profit = profits.sum()
        avg_profit_per_order = total_profit / total_orders if total_orders > 0 else 0
        avg_profit_per_customer = total_profit / n if n > 0 else 0

        return {
            'segment': segment_name,
            'count': n,
            'mean_orders': round(orders.mean(), 2),
            'median_orders': int(orders.median()),
            'pct_2_plus': round((orders >= 2).sum() / n * 100, 1),
            'pct_3_plus': round((orders >= 3).sum() / n * 100, 1),
            'distribution': dist,
            # Profit metrics
            'total_orders': int(total_orders),
            'total_profit': round(total_profit, 0),
            'avg_profit_per_order': round(avg_profit_per_order, 2),
            'avg_profit_per_customer': round(avg_profit_per_customer, 2),
        }

    stats = []
    stats.append(get_segment_stats(used_cb_ids, 'Used Cashback'))
    stats.append(get_segment_stats(club_no_cb_ids, 'Club (no CB)'))
    stats.append(get_segment_stats(non_club_ids, 'Non-Club'))

    print(f"\n{'='*80}")
    print(f"ENGAGEMENT STATS (Orders within 60 days of first order)")
    print(f"{'='*80}")

    for s in stats:
        if s:
            print(f"\n{s['segment']}:")
            print(f"  Customers: {s['count']:,}")
            print(f"  Mean orders: {s['mean_orders']}")
            print(f"  Median orders: {s['median_orders']}")
            print(f"  % with 2+ orders: {s['pct_2_plus']}%")
            print(f"  % with 3+ orders: {s['pct_3_plus']}%")
            print(f"  --- PROFIT ---")
            print(f"  Total orders: {s['total_orders']:,}")
            print(f"  Total profit: {s['total_profit']:,.0f} DKK")
            print(f"  Avg profit/order: {s['avg_profit_per_order']:.2f} DKK")
            print(f"  Avg profit/customer: {s['avg_profit_per_customer']:.2f} DKK")
            dist_str = [(d['orders'], d['count'], f"{d['pct']}%") for d in s['distribution']]
            print(f"  Distribution: {dist_str}")

    return stats


def analyze_full_engagement(orders, cashback_records):
    """
    DEPRECATED - Use analyze_full_engagement_60d instead.
    Full engagement analysis for ALL fresh customers (not just converters).
    Segments by: Used Cashback, Club (no CB), Non-Club

    Uses the SAME 60-day conversion window for order counting.
    """
    print(f"\n{'='*80}")
    print(f"FULL FRESH CUSTOMER ENGAGEMENT ANALYSIS")
    print(f"{'='*80}")

    # Get all orders in the After period (for order counting)
    after_orders = orders[
        (orders['COMPLETED_AT_DATE'] >= AFTER_START) &
        (orders['COMPLETED_AT_DATE'] <= AFTER_END)
    ].copy()

    # Sort and identify first orders
    after_orders = after_orders.sort_values(['UNIQUE_CUSTOMER_ID', 'COMPLETED_AT_DATE'])

    customer_orders = after_orders.groupby('UNIQUE_CUSTOMER_ID').agg({
        'COMPLETED_AT_DATE': list,
        'ORDER_NUMBER': list,
    }).reset_index()

    customer_orders['first_order_date'] = customer_orders['COMPLETED_AT_DATE'].apply(lambda x: x[0])

    # Filter to FRESH customers only (first order in our window)
    fresh = customer_orders[
        (customer_orders['first_order_date'] >= AFTER_START) &
        (customer_orders['first_order_date'] <= OBSERVATION_CUTOFF)
    ].copy()

    print(f"Fresh customers (first order {AFTER_START.date()} - {OBSERVATION_CUTOFF.date()}): {len(fresh):,}")

    # Get ALL order numbers for fresh customers
    all_order_numbers = set()
    for order_list in fresh['ORDER_NUMBER']:
        all_order_numbers.update(order_list)

    # Create mapping: order_number -> customer_id
    order_to_customer = {}
    for _, row in fresh.iterrows():
        for order_num in row['ORDER_NUMBER']:
            order_to_customer[order_num] = row['UNIQUE_CUSTOMER_ID']

    # Find which customers used cashback
    if len(cashback_records) > 0:
        cb_records = cashback_records[
            (cashback_records['order_number'].isin(all_order_numbers)) &
            (cashback_records['redeemed_cents'] > 0)
        ]
        customers_with_cb = set(cb_records['customer_id'].unique())
    else:
        customers_with_cb = set()

    print(f"Fresh customers who used cashback: {len(customers_with_cb):,}")

    # Get Club status for orders
    fresh_order_details = after_orders[after_orders['ORDER_NUMBER'].isin(all_order_numbers)].copy()

    # Determine Club membership: customer has any order with customerGroupKey = 'club'
    club_orders = fresh_order_details[fresh_order_details['CUSTOMER_GROUP_KEY'] == 'club']
    customers_with_club_order = set(club_orders['UNIQUE_CUSTOMER_ID'].unique())

    print(f"Fresh customers with Club orders: {len(customers_with_club_order):,}")

    # Segment customers
    used_cb_customers = customers_with_cb
    club_no_cb_customers = customers_with_club_order - customers_with_cb
    non_club_customers = set(fresh['UNIQUE_CUSTOMER_ID']) - customers_with_club_order

    print(f"\nSegmentation:")
    print(f"  Used Cashback: {len(used_cb_customers):,}")
    print(f"  Club (no CB): {len(club_no_cb_customers):,}")
    print(f"  Non-Club: {len(non_club_customers):,}")
    print(f"  Total: {len(used_cb_customers) + len(club_no_cb_customers) + len(non_club_customers):,}")

    # Calculate order counts per customer within 60-day window from first order
    def count_orders_in_60d(row):
        """Count orders within 60 days of first order."""
        first_date = row['first_order_date']
        window_end = first_date + timedelta(days=CONVERSION_WINDOW_DAYS)
        orders_in_window = [d for d in row['COMPLETED_AT_DATE'] if d <= window_end]
        return len(orders_in_window)

    fresh['orders_in_60d'] = fresh.apply(count_orders_in_60d, axis=1)

    # Get stats per segment
    def get_segment_stats(customer_ids, segment_name):
        segment = fresh[fresh['UNIQUE_CUSTOMER_ID'].isin(customer_ids)]
        n = len(segment)

        if n == 0:
            return None

        orders = segment['orders_in_60d']

        # Order distribution
        dist = {1: 0, 2: 0, 3: 0, 4: 0, '5+': 0}
        for o in orders:
            if o >= 5:
                dist['5+'] += 1
            else:
                dist[o] = dist.get(o, 0) + 1

        return {
            'segment': segment_name,
            'count': n,
            'mean_orders': round(orders.mean(), 2),
            'median_orders': int(orders.median()),
            'pct_2_plus': round((orders >= 2).sum() / n * 100, 1),
            'pct_3_plus': round((orders >= 3).sum() / n * 100, 1),
            'distribution': dist
        }

    stats = []
    stats.append(get_segment_stats(used_cb_customers, 'Used Cashback'))
    stats.append(get_segment_stats(club_no_cb_customers, 'Club (no CB)'))
    stats.append(get_segment_stats(non_club_customers, 'Non-Club'))

    print(f"\n{'='*80}")
    print(f"ENGAGEMENT STATS (Orders within 60 days of first order)")
    print(f"{'='*80}")

    for s in stats:
        if s:
            print(f"\n{s['segment']}:")
            print(f"  Customers: {s['count']:,}")
            print(f"  Mean orders: {s['mean_orders']}")
            print(f"  Median orders: {s['median_orders']}")
            print(f"  % with 2+ orders: {s['pct_2_plus']}%")
            print(f"  % with 3+ orders: {s['pct_3_plus']}%")
            print(f"  Distribution: {s['distribution']}")

    return stats


def main():
    orders = load_orders()
    cashback_records = get_cashback_data()

    # Analysis 1: Converter cashback usage (matches Fresh Customers card)
    fresh_customers, converters, converter_orders_df = identify_fresh_converters(orders)
    cb_results = analyze_converter_cashback(converters, converter_orders_df, cashback_records)

    # Run full engagement analysis with 60-day order counting
    engagement_stats = analyze_full_engagement_60d(orders, cashback_records, fresh_customers)

    print(f"\n{'='*80}")
    print(f"SUMMARY - VALUES FOR DASHBOARD UPDATE")
    print(f"{'='*80}")

    if cb_results:
        print(f"""
FRESH_CUSTOMERS - Two Definitions:

A) Cashback on ANY order (converters who ever used cashback):
   convertersWithCashback: {cb_results['converters_with_cb_any']}
   converterCashbackRate: {cb_results['cb_usage_rate_any']:.2f}%
   totalCashbackRedeemed: {cb_results['total_cb_redeemed_any']:,.0f} DKK

B) Cashback on 2ND ORDER ONLY:
   convertersWithCashback: {cb_results['converters_with_cb_2nd']}
   converterCashbackRate: {cb_results['cb_usage_rate_2nd']:.2f}%
   totalCashbackRedeemed: {cb_results['total_cb_redeemed_2nd']:,.0f} DKK

Dashboard currently shows 6,694 - check which definition matches!
""")

    if engagement_stats:
        print(f"""
FRESH_ENGAGEMENT (Full segmentation - 60-day window):
""")
        for s in engagement_stats:
            if s:
                print(f"  {s['segment']}:")
                print(f"    count: {s['count']}")
                print(f"    meanOrders: {s['mean_orders']}")
                print(f"    medianOrders: {s['median_orders']}")
                print(f"    pct2PlusOrders: {s['pct_2_plus']}")
                print(f"    pct3PlusOrders: {s['pct_3_plus']}")
                print(f"    avgProfitPerOrder: {s['avg_profit_per_order']}")
                print(f"    avgProfitPerCustomer: {s['avg_profit_per_customer']}")
                print()


if __name__ == "__main__":
    main()
