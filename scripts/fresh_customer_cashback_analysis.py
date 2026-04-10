#!/usr/bin/env python3
"""
Fresh Customer Cashback Analysis

For customers who converted (1st → 2nd order) after Club launch:
1. How many used cashback on their 2nd order?
2. What was the total cashback cost?

This answers the CEO question about the TRUE cost of fresh customers.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
CONVERSION_WINDOW_DAYS = 60


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

    for col in ['GROSS_AMOUNT_DKK', 'PROFIT_TRACKING_TOTAL_PROFIT_DKK']:
        orders[col] = pd.to_numeric(orders[col], errors='coerce').fillna(0)

    orders = orders[
        (orders['ORDER_STATE'] == 'Complete') &
        (orders['IS_INTERNAL_ORDER'] == False) &
        (orders['IS_ORDER_RESEND'] == False) &
        (orders['IS_AN_ORDER_EXCHANGE'] == False)
    ].copy()

    print(f"Valid orders: {len(orders):,}")
    return orders


def get_cashback_data():
    """Get cashback redemption data from database."""
    print("\nGetting cashback data from database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Get all cashback records with order numbers
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
        # Calculate balance change per record (to detect redemptions)
        # Group by customer and calculate running balance
        cashback_records['recorded_at'] = pd.to_datetime(cashback_records['recorded_at'])
        cashback_records = cashback_records.sort_values(['customer_id', 'recorded_at'])

        # Calculate previous balance for each customer
        cashback_records['prev_balance'] = cashback_records.groupby('customer_id')['balance_cents'].shift(1)
        cashback_records['balance_change'] = cashback_records['balance_cents'] - cashback_records['prev_balance'].fillna(0)

        # Negative balance change = redemption
        cashback_records['redeemed_cents'] = cashback_records['balance_change'].apply(lambda x: abs(x) if x < 0 else 0)
        cashback_records['redeemed_dkk'] = cashback_records['redeemed_cents'] / 100

        print(f"Cashback records: {len(cashback_records):,}")
        print(f"Records with redemption: {(cashback_records['redeemed_cents'] > 0).sum():,}")

    return cashback_records


def analyze_fresh_customers(orders, cashback_records):
    """Analyze fresh customers who converted after Club launch."""

    # Identify first-time customers
    customer_first_order = orders.groupby('UNIQUE_CUSTOMER_ID').agg({
        'COMPLETED_AT_DATE': 'min',
        'ORDER_NUMBER': 'first'
    }).reset_index()
    customer_first_order.columns = ['customer_id', 'first_order_date', 'first_order_number']

    # Fresh customers = first order AFTER Club launch
    # But we need to look at conversion within 60 days, so first order must be early enough
    # to allow 60 days before data ends
    data_end = orders['COMPLETED_AT_DATE'].max()
    cutoff_date = data_end - pd.Timedelta(days=CONVERSION_WINDOW_DAYS)

    fresh_after_club = customer_first_order[
        (customer_first_order['first_order_date'] >= CLUB_LAUNCH_DATE) &
        (customer_first_order['first_order_date'] <= cutoff_date)
    ].copy()

    print(f"\n{'='*80}")
    print(f"FRESH CUSTOMERS AFTER CLUB LAUNCH")
    print(f"{'='*80}")
    print(f"First order between: {CLUB_LAUNCH_DATE.date()} and {cutoff_date.date()}")
    print(f"Fresh customers: {len(fresh_after_club):,}")

    # Get all orders for these fresh customers
    fresh_customer_ids = set(fresh_after_club['customer_id'])
    fresh_orders = orders[orders['UNIQUE_CUSTOMER_ID'].isin(fresh_customer_ids)].copy()

    # Number each customer's orders
    fresh_orders = fresh_orders.sort_values(['UNIQUE_CUSTOMER_ID', 'COMPLETED_AT_DATE'])
    fresh_orders['order_rank'] = fresh_orders.groupby('UNIQUE_CUSTOMER_ID').cumcount() + 1

    # Merge first order date
    fresh_orders = fresh_orders.merge(
        fresh_after_club[['customer_id', 'first_order_date']],
        left_on='UNIQUE_CUSTOMER_ID',
        right_on='customer_id',
        how='left'
    )

    # Identify 2nd orders within 60 days
    fresh_orders['days_since_first'] = (fresh_orders['COMPLETED_AT_DATE'] - fresh_orders['first_order_date']).dt.days
    second_orders = fresh_orders[
        (fresh_orders['order_rank'] == 2) &
        (fresh_orders['days_since_first'] <= CONVERSION_WINDOW_DAYS)
    ].copy()

    print(f"Converted (2nd order within {CONVERSION_WINDOW_DAYS}d): {len(second_orders):,}")
    conversion_rate = len(second_orders) / len(fresh_after_club) * 100
    print(f"Conversion rate: {conversion_rate:.2f}%")

    # Check cashback usage on 2nd orders
    print(f"\n{'='*80}")
    print(f"CASHBACK ANALYSIS FOR 2ND ORDERS")
    print(f"{'='*80}")

    if len(cashback_records) > 0:
        # Find which 2nd orders have cashback records (indicates cashback activity)
        second_order_numbers = set(second_orders['ORDER_NUMBER'])
        cb_on_second_orders = cashback_records[cashback_records['order_number'].isin(second_order_numbers)]

        orders_with_cb_record = cb_on_second_orders['order_number'].nunique()
        orders_with_redemption = cb_on_second_orders[cb_on_second_orders['redeemed_cents'] > 0]['order_number'].nunique()
        total_redeemed = cb_on_second_orders['redeemed_dkk'].sum()

        print(f"2nd orders with ANY cashback record: {orders_with_cb_record:,}")
        print(f"2nd orders with cashback REDEEMED: {orders_with_redemption:,}")
        print(f"Total cashback redeemed on 2nd orders: {total_redeemed:,.0f} DKK")

        # Calculate per-converter metrics
        if orders_with_redemption > 0:
            avg_redemption = total_redeemed / orders_with_redemption
            print(f"Avg cashback per redemption: {avg_redemption:.2f} DKK")

        cb_usage_rate = orders_with_redemption / len(second_orders) * 100 if len(second_orders) > 0 else 0
        print(f"CB redemption rate on 2nd orders: {cb_usage_rate:.2f}%")

        # Monthly breakdown
        months_in_period = (cutoff_date - CLUB_LAUNCH_DATE).days / 30.44
        monthly_converters = len(second_orders) / months_in_period
        monthly_cb_cost = total_redeemed / months_in_period

        print(f"\n{'='*80}")
        print(f"MONTHLY COST BREAKDOWN")
        print(f"{'='*80}")
        print(f"Analysis period: {months_in_period:.1f} months")
        print(f"Monthly converters: {monthly_converters:.0f}")
        print(f"Monthly cashback cost (from 2nd orders): {monthly_cb_cost:,.0f} DKK/mo")

        # Complete picture
        print(f"\n{'='*80}")
        print(f"COMPLETE FRESH CUSTOMER COST PICTURE")
        print(f"{'='*80}")

        # Lost conversions (from original analysis)
        # Before rate was 8.06%, after is 7.21%, diff = -0.85pp
        # Monthly new customers ~34,026
        # Lost conversions = 0.85% × 34,026 = ~289
        # Lost profit = 289 × 197 DKK = ~57,005 DKK/mo
        lost_conversions_cost = -57005  # From original analysis

        print(f"""
┌─────────────────────────────────────────────────────────────────────────────────┐
│ FRESH CUSTOMER ECONOMICS (Monthly)                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ CONVERTERS ({len(second_orders):,} total, {monthly_converters:.0f}/mo)                                             │
│   - Used cashback: {orders_with_redemption:,} ({cb_usage_rate:.1f}% of converters)                              │
│   - Cashback cost: {total_redeemed:,.0f} DKK total / {months_in_period:.1f} mo = {monthly_cb_cost:,.0f} DKK/mo               │
│                                                                                 │
│ LOST CONVERSIONS                                                                │
│   - Conversion rate drop: -0.85pp (8.06% → 7.21%)                               │
│   - Lost 2nd orders: ~289/mo                                                    │
│   - Lost profit: ~57,005 DKK/mo                                                 │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ TOTAL MONTHLY COST:                                                             │
│   Cost 1 (Cashback for converters):     {monthly_cb_cost:>10,.0f} DKK/mo                    │
│   Cost 2 (Lost conversion profit):      {abs(lost_conversions_cost):>10,.0f} DKK/mo                    │
│   ─────────────────────────────────────────────────                             │
│   TOTAL:                                {monthly_cb_cost + abs(lost_conversions_cost):>10,.0f} DKK/mo                    │
│                                                                                 │
│ Note: Cashback cost is already reflected in profit figures when redeemed.       │
│       The -57k lost profit already accounts for lower profits on CB orders.     │
│       So these costs should NOT be simply added - see explanation below.        │
└─────────────────────────────────────────────────────────────────────────────────┘
""")

        # Important clarification
        print(f"""
IMPORTANT CLARIFICATION:
─────────────────────────
The cashback cost of {monthly_cb_cost:,.0f} DKK/mo is for the {monthly_converters:.0f} customers who DID convert.
The -57k/mo is for the ~289 customers who DIDN'T convert (compared to before Club).

These are TWO DIFFERENT groups:
1. Converters: {monthly_converters:.0f}/mo - they cost us {monthly_cb_cost:,.0f} DKK in cashback
2. Non-converters: +289/mo more than before - they cost us ~57k in lost profit

BUT: The -57k calculation uses profit AFTER cashback redemption.
So it already accounts for lower margins on CB orders.

The INCREMENTAL insight is:
- Fresh customers who convert are using {cb_usage_rate:.1f}% cashback redemption rate
- This is {'higher' if cb_usage_rate > 9 else 'lower'} than Best customers (9%) and {'higher' if cb_usage_rate > 6.3 else 'lower'} than Medium customers (6.3%)
""")

        return {
            'total_converters': len(second_orders),
            'converters_with_cb': orders_with_redemption,
            'cb_usage_rate': cb_usage_rate,
            'total_cb_redeemed': total_redeemed,
            'monthly_cb_cost': monthly_cb_cost,
            'months_in_period': months_in_period,
        }
    else:
        print("No cashback records found!")
        return None


def main():
    orders = load_orders()
    cashback_records = get_cashback_data()
    results = analyze_fresh_customers(orders, cashback_records)

    if results:
        print(f"\n{'='*80}")
        print(f"SUMMARY FOR DASHBOARD UPDATE")
        print(f"{'='*80}")
        print(f"""
Add to Fresh Customers segment:

CONVERTERS (24,533 total):
- Cashback redemption rate: {results['cb_usage_rate']:.1f}%
- Total cashback redeemed: {results['total_cb_redeemed']:,.0f} DKK
- Monthly cashback cost: {results['monthly_cb_cost']:,.0f} DKK/mo

This gives complete visibility into Fresh Customer economics:
- How many convert (24,533 = 7.21%)
- How many use cashback ({results['converters_with_cb']:,} = {results['cb_usage_rate']:.1f}%)
- What it costs in cashback ({results['monthly_cb_cost']:,.0f} DKK/mo)
""")


if __name__ == "__main__":
    main()
