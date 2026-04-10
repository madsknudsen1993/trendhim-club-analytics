#!/usr/bin/env python3
"""
Segment-Isolated P&L Analysis

Calculate ALL metrics for Best and Medium customer segments in isolation:
- Items per order (AOQ)
- Shipping revenue per order (DKK converted)
- Free shipping %
- Segment-specific shipping costs
- Frequency
- Avg. Cashback spent
- AOV
- Avg. Profit per order
- Monthly profit
- Monthly profit lift

Uses ONLY data from the specific segment customers.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration
ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")

# These will be calculated from actual data
BEFORE_START = None
BEFORE_END = None
AFTER_START = pd.Timestamp("2025-04-01")  # Club launch date
AFTER_END = None
MONTHS_BEFORE = None
MONTHS_AFTER = None

# Shipping thresholds (CORRECT values)
SHIPPING_THRESHOLDS = {
    'DK': {'club': 199, 'nonClub': 449, 'currency': 'DKK'},
    'SE': {'club': 349, 'nonClub': 549, 'currency': 'SEK'},
    'NO': {'club': 349, 'nonClub': 549, 'currency': 'NOK'},
    'DE': {'club': 39, 'nonClub': 59, 'currency': 'EUR'},
    'GB': {'club': 29, 'nonClub': 49, 'currency': 'GBP'},
    'NL': {'club': 39, 'nonClub': 59, 'currency': 'EUR'},
    'AT': {'club': 39, 'nonClub': 59, 'currency': 'EUR'},
    'CH': {'club': 49, 'nonClub': 79, 'currency': 'CHF'},
    'PL': {'club': 149, 'nonClub': 249, 'currency': 'PLN'},
}

# FX rates to DKK (approximate)
FX_RATES = {
    'DKK': 1.0,
    'SEK': 0.64,
    'NOK': 0.62,
    'EUR': 7.46,
    'GBP': 8.70,
    'CHF': 7.80,
    'PLN': 1.73,
    'USD': 6.90,
}

# Average shipping fee when customer pays (DKK)
AVG_SHIPPING_FEE_DKK = 39.0


def load_order_data():
    """Load and prepare order history data."""
    global BEFORE_START, BEFORE_END, AFTER_END, MONTHS_BEFORE, MONTHS_AFTER

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
    numeric_cols = [
        'SHIPPING_GROSS_AMOUNT_DKK', 'GROSS_AMOUNT_DKK',
        'PROFIT_TRACKING_TOTAL_PROFIT_DKK', 'PRODUCT_QUANTITY'
    ]
    for col in numeric_cols:
        if col in orders.columns:
            orders[col] = pd.to_numeric(orders[col], errors='coerce').fillna(0)

    # Filter valid orders
    orders = orders[
        (orders['ORDER_STATE'] == 'Complete') &
        (orders['IS_INTERNAL_ORDER'] == False) &
        (orders['IS_ORDER_RESEND'] == False) &
        (orders['IS_AN_ORDER_EXCHANGE'] == False)
    ].copy()

    # Calculate actual date ranges from data
    BEFORE_START = orders[orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE]['COMPLETED_AT_DATE'].min()
    BEFORE_END = CLUB_LAUNCH_DATE - pd.Timedelta(days=1)
    AFTER_END = orders[orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE]['COMPLETED_AT_DATE'].max()

    # Calculate calendar months (using 30.44 days per month like original)
    MONTHS_BEFORE = (CLUB_LAUNCH_DATE - BEFORE_START).days / 30.44
    MONTHS_AFTER = (AFTER_END - CLUB_LAUNCH_DATE).days / 30.44

    print(f"Valid orders: {len(orders):,}")
    print(f"Date range: {orders['COMPLETED_AT_DATE'].min()} to {orders['COMPLETED_AT_DATE'].max()}")
    print(f"Before period: {BEFORE_START.strftime('%Y-%m-%d')} to {BEFORE_END.strftime('%Y-%m-%d')} ({MONTHS_BEFORE:.2f} months)")
    print(f"After period: {CLUB_LAUNCH_DATE.strftime('%Y-%m-%d')} to {AFTER_END.strftime('%Y-%m-%d')} ({MONTHS_AFTER:.2f} months)")

    return orders


def load_cashback_data():
    """
    Load cashback data from database and calculate actual cashback SPENT per order.

    The database stores balance_cents = running balance AFTER the order.
    To get cashback SPENT, we need to track balance changes per customer.
    When balance decreases between orders, that's cashback REDEEMED.
    """
    print("\nLoading Cashback data from database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get cashback records with order numbers, ordered by customer and date
        cursor.execute("""
            SELECT
                order_number,
                customer_id,
                balance_cents,
                currency_code,
                recorded_at
            FROM customer_cashback
            WHERE order_number IS NOT NULL
            ORDER BY customer_id, recorded_at
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        if rows:
            cashback = pd.DataFrame(rows)
            cashback['recorded_at'] = pd.to_datetime(cashback['recorded_at'])

            # Calculate cashback CHANGE per order (negative = spent, positive = earned)
            cashback = cashback.sort_values(['customer_id', 'recorded_at'])
            cashback['prev_balance'] = cashback.groupby('customer_id')['balance_cents'].shift(1).fillna(0)
            cashback['balance_change'] = cashback['balance_cents'] - cashback['prev_balance']

            # Cashback REDEEMED = negative change (balance went down)
            cashback['cashback_redeemed_cents'] = cashback['balance_change'].apply(lambda x: -x if x < 0 else 0)

            # Convert to DKK
            cashback['cashback_redeemed_dkk'] = cashback.apply(
                lambda row: row['cashback_redeemed_cents'] / 100 * FX_RATES.get(row['currency_code'], 7.46),
                axis=1
            )

            # For analysis, mark orders with cashback redemption
            cashback['used_cashback'] = cashback['cashback_redeemed_cents'] > 0

            print(f"Cashback records: {len(cashback):,}")
            print(f"Orders with CB redeemed: {cashback['used_cashback'].sum():,}")
            print(f"Avg CB redeemed (when used): {cashback[cashback['used_cashback']]['cashback_redeemed_dkk'].mean():.2f} DKK")

            return cashback
        else:
            print("No cashback records found!")
            return None

    except Exception as e:
        print(f"Cashback DB Error: {e}")
        return None


def get_club_orders():
    """Get Club order numbers from database."""
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
        return club_order_numbers
    except Exception as e:
        print(f"DB Error: {e}")
        return set()


def identify_segments(orders, club_order_numbers):
    """Identify Best and Medium customer segments."""

    # Tag Club orders
    orders['is_club_order'] = orders['ORDER_NUMBER'].isin(club_order_numbers)

    # Split by period (use CLUB_LAUNCH_DATE as divider)
    before_df = orders[orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after_df = orders[orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Identify Club members (have at least one Club order after launch)
    club_members = set(after_df[after_df['is_club_order']]['UNIQUE_CUSTOMER_ID'].unique())
    print(f"\nClub members identified: {len(club_members):,}")

    # Calculate stats for each customer in each period
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

    # BEST CUSTOMERS: 2+ orders AND 60+ days in BOTH periods, AND is Club member
    best_before = set(before_stats[(before_stats['orders'] >= 2) & (before_stats['days'] >= 60)].index)
    best_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days'] >= 60)].index)
    best_customers = best_before & best_after & club_members

    # MEDIUM CUSTOMERS: 1+ order before, 2+ orders AND 60+ days after, AND is Club member
    # Exclude Best customers to avoid overlap
    medium_before = set(before_stats[before_stats['orders'] >= 1].index)
    medium_after = set(after_stats[(after_stats['orders'] >= 2) & (after_stats['days'] >= 60)].index)
    medium_customers = (medium_before & medium_after & club_members) - best_customers

    print(f"Best Customers: {len(best_customers):,}")
    print(f"Medium Customers: {len(medium_customers):,}")

    return best_customers, medium_customers, club_members


def get_country_from_order(row):
    """Extract country code from order (using COUNTRY column if available)."""
    if 'COUNTRY' in row.index and pd.notna(row['COUNTRY']):
        country = str(row['COUNTRY']).upper()[:2]
        if country in SHIPPING_THRESHOLDS:
            return country
    return 'DK'  # Default to Denmark


def calculate_segment_metrics(orders, cashback_df, segment_ids, segment_name):
    """Calculate all metrics for a specific segment."""

    print(f"\n{'='*80}")
    print(f"SEGMENT: {segment_name} ({len(segment_ids):,} customers)")
    print(f"{'='*80}")

    # Filter to segment customers only
    segment_orders = orders[orders['UNIQUE_CUSTOMER_ID'].isin(segment_ids)].copy()

    # Split before/after
    before = segment_orders[segment_orders['COMPLETED_AT_DATE'] < CLUB_LAUNCH_DATE].copy()
    after = segment_orders[segment_orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE].copy()

    # Add flags
    for df in [before, after]:
        df['is_free_shipping'] = df['SHIPPING_GROSS_AMOUNT_DKK'] == 0

    # Get cashback data for this segment
    segment_cashback_before = None
    segment_cashback_after = None

    if cashback_df is not None:
        # Match cashback to orders by order number
        if 'order_number' in cashback_df.columns:
            before_order_nums = set(before['ORDER_NUMBER'].unique())
            after_order_nums = set(after['ORDER_NUMBER'].unique())
            segment_cashback_before = cashback_df[cashback_df['order_number'].isin(before_order_nums)]
            segment_cashback_after = cashback_df[cashback_df['order_number'].isin(after_order_nums)]

    # Calculate metrics
    results = {
        'segment': segment_name,
        'customers': len(segment_ids),
        'months_before': round(MONTHS_BEFORE, 2),
        'months_after': round(MONTHS_AFTER, 2),
    }

    for period_name, df, cb_df in [('before', before, segment_cashback_before),
                                    ('after', after, segment_cashback_after)]:
        prefix = period_name
        months = MONTHS_BEFORE if period_name == 'before' else MONTHS_AFTER

        # Basic counts
        results[f'{prefix}_orders'] = len(df)
        results[f'{prefix}_customer_months'] = len(segment_ids) * months

        # Frequency (orders per customer per month)
        results[f'{prefix}_frequency'] = len(df) / (len(segment_ids) * months) if len(segment_ids) > 0 else 0

        # Items per order (AOQ)
        if 'PRODUCT_QUANTITY' in df.columns:
            results[f'{prefix}_items_per_order'] = df['PRODUCT_QUANTITY'].mean()
        else:
            results[f'{prefix}_items_per_order'] = 0

        # AOV
        results[f'{prefix}_aov'] = df['GROSS_AMOUNT_DKK'].mean() if len(df) > 0 else 0

        # Profit per order
        results[f'{prefix}_profit_per_order'] = df['PROFIT_TRACKING_TOTAL_PROFIT_DKK'].mean() if len(df) > 0 else 0

        # Shipping revenue per order
        results[f'{prefix}_shipping_per_order'] = df['SHIPPING_GROSS_AMOUNT_DKK'].mean() if len(df) > 0 else 0

        # Free shipping %
        results[f'{prefix}_free_shipping_pct'] = df['is_free_shipping'].mean() * 100 if len(df) > 0 else 0

        # Monthly profit per customer
        freq = results[f'{prefix}_frequency']
        profit_per_order = results[f'{prefix}_profit_per_order']
        results[f'{prefix}_monthly_profit'] = freq * profit_per_order

        # Cashback metrics - using cashback_redeemed_dkk (actual amount SPENT)
        if cb_df is not None and len(cb_df) > 0 and 'cashback_redeemed_dkk' in cb_df.columns:
            cb_with_redemption = cb_df[cb_df['cashback_redeemed_dkk'] > 0]
            cb_orders = len(cb_with_redemption)
            total_cb = cb_with_redemption['cashback_redeemed_dkk'].sum()

            # Use MEDIAN for typical values (outliers skew mean heavily)
            median_cb = cb_with_redemption['cashback_redeemed_dkk'].median() if cb_orders > 0 else 0

            results[f'{prefix}_cashback_orders'] = cb_orders
            results[f'{prefix}_total_cashback'] = total_cb
            results[f'{prefix}_median_cashback_per_cb_order'] = median_cb
            results[f'{prefix}_avg_cashback_per_order'] = total_cb / len(df) if len(df) > 0 else 0
            results[f'{prefix}_cashback_usage_rate'] = cb_orders / len(df) * 100 if len(df) > 0 else 0
        else:
            results[f'{prefix}_cashback_orders'] = 0
            results[f'{prefix}_total_cashback'] = 0
            results[f'{prefix}_median_cashback_per_cb_order'] = 0
            results[f'{prefix}_avg_cashback_per_order'] = 0
            results[f'{prefix}_cashback_usage_rate'] = 0

    # Calculate shipping costs (subsidy)
    # For AFTER period only - orders in subsidy zone (199-449 DKK) that got free shipping
    after_subsidy_zone = after[
        (after['GROSS_AMOUNT_DKK'] >= 199) &
        (after['GROSS_AMOUNT_DKK'] < 449)
    ]
    after_subsidy_free = after_subsidy_zone[after_subsidy_zone['is_free_shipping']]

    # Before period - same zone, free shipping rate (baseline)
    before_subsidy_zone = before[
        (before['GROSS_AMOUNT_DKK'] >= 199) &
        (before['GROSS_AMOUNT_DKK'] < 449)
    ]
    before_subsidy_free = before_subsidy_zone[before_subsidy_zone['is_free_shipping']]

    # Incremental free shipping = after rate - before rate
    before_free_rate = len(before_subsidy_free) / len(before_subsidy_zone) if len(before_subsidy_zone) > 0 else 0
    after_free_rate = len(after_subsidy_free) / len(after_subsidy_zone) if len(after_subsidy_zone) > 0 else 0
    incremental_rate = after_free_rate - before_free_rate

    # Calculate shipping cost
    incremental_free_orders = len(after_subsidy_zone) * max(0, incremental_rate)
    shipping_cost_total = incremental_free_orders * AVG_SHIPPING_FEE_DKK
    shipping_cost_monthly = shipping_cost_total / MONTHS_AFTER

    results['subsidy_zone_orders_before'] = len(before_subsidy_zone)
    results['subsidy_zone_orders_after'] = len(after_subsidy_zone)
    results['subsidy_zone_free_rate_before'] = before_free_rate * 100
    results['subsidy_zone_free_rate_after'] = after_free_rate * 100
    results['incremental_free_rate_pp'] = incremental_rate * 100
    results['incremental_free_orders'] = incremental_free_orders
    results['shipping_cost_total'] = shipping_cost_total
    results['shipping_cost_monthly'] = shipping_cost_monthly

    # Calculate changes
    results['frequency_change_pct'] = (
        (results['after_frequency'] / results['before_frequency'] - 1) * 100
        if results['before_frequency'] > 0 else 0
    )
    results['aov_change_pct'] = (
        (results['after_aov'] / results['before_aov'] - 1) * 100
        if results['before_aov'] > 0 else 0
    )
    results['profit_per_order_change_pct'] = (
        (results['after_profit_per_order'] / results['before_profit_per_order'] - 1) * 100
        if results['before_profit_per_order'] > 0 else 0
    )
    results['monthly_profit_change_pct'] = (
        (results['after_monthly_profit'] / results['before_monthly_profit'] - 1) * 100
        if results['before_monthly_profit'] > 0 else 0
    )
    results['monthly_profit_lift'] = results['after_monthly_profit'] - results['before_monthly_profit']

    # Total monthly value for segment
    results['total_monthly_value'] = results['monthly_profit_lift'] * len(segment_ids)
    results['total_monthly_value_net'] = results['total_monthly_value'] - shipping_cost_monthly

    return results


def print_segment_results(results):
    """Print formatted results for a segment."""

    print(f"\n{'-'*80}")
    print(f"METRICS: {results['segment']}")
    print(f"{'-'*80}")

    print(f"\nSample: {results['customers']:,} customers")
    print(f"Period: {results['months_before']} months before, {results['months_after']} months after")

    # Main metrics table
    print(f"\n{'Metric':<25} {'BEFORE':<15} {'AFTER':<15} {'Change':<15}")
    print("-" * 70)

    metrics = [
        ('Orders', 'before_orders', 'after_orders', None),
        ('Frequency (orders/mo)', 'before_frequency', 'after_frequency', 'frequency_change_pct'),
        ('Items/Order (AOQ)', 'before_items_per_order', 'after_items_per_order', None),
        ('AOV (DKK)', 'before_aov', 'after_aov', 'aov_change_pct'),
        ('Profit/Order (DKK)', 'before_profit_per_order', 'after_profit_per_order', 'profit_per_order_change_pct'),
        ('Shipping/Order (DKK)', 'before_shipping_per_order', 'after_shipping_per_order', None),
        ('Free Shipping %', 'before_free_shipping_pct', 'after_free_shipping_pct', None),
        ('Monthly Profit (DKK)', 'before_monthly_profit', 'after_monthly_profit', 'monthly_profit_change_pct'),
    ]

    for label, before_key, after_key, change_key in metrics:
        before_val = results.get(before_key, 0)
        after_val = results.get(after_key, 0)

        if 'frequency' in before_key.lower():
            before_str = f"{before_val:.3f}"
            after_str = f"{after_val:.3f}"
        elif '%' in label:
            before_str = f"{before_val:.1f}%"
            after_str = f"{after_val:.1f}%"
        elif isinstance(before_val, float):
            before_str = f"{before_val:.2f}"
            after_str = f"{after_val:.2f}"
        else:
            before_str = f"{before_val:,}"
            after_str = f"{after_val:,}"

        if change_key and change_key in results:
            change_val = results[change_key]
            change_str = f"{change_val:+.1f}%"
        elif '%' in label:
            change_str = f"{after_val - before_val:+.1f}pp"
        else:
            change_str = "-"

        print(f"{label:<25} {before_str:<15} {after_str:<15} {change_str:<15}")

    # Cashback metrics
    print(f"\n{'Cashback Metrics':<25} {'BEFORE':<15} {'AFTER':<15}")
    print("-" * 55)
    print(f"{'CB Orders':<25} {results.get('before_cashback_orders', 0):,}              {results.get('after_cashback_orders', 0):,}")
    print(f"{'CB Usage Rate':<25} {results.get('before_cashback_usage_rate', 0):.1f}%             {results.get('after_cashback_usage_rate', 0):.1f}%")
    print(f"{'Median CB/CB Order':<25} {results.get('before_median_cashback_per_cb_order', 0):.2f}           {results.get('after_median_cashback_per_cb_order', 0):.2f}")
    print(f"{'Total CB Redeemed':<25} {results.get('before_total_cashback', 0):,.0f}           {results.get('after_total_cashback', 0):,.0f}")

    # Shipping cost analysis
    print(f"\n{'='*80}")
    print("SHIPPING COST (SUBSIDY ZONE: 199-449 DKK)")
    print(f"{'='*80}")
    print(f"Orders in subsidy zone:  {results['subsidy_zone_orders_before']:,} (before) → {results['subsidy_zone_orders_after']:,} (after)")
    print(f"Free shipping rate:      {results['subsidy_zone_free_rate_before']:.1f}% (before) → {results['subsidy_zone_free_rate_after']:.1f}% (after)")
    print(f"Incremental free rate:   {results['incremental_free_rate_pp']:+.1f}pp")
    print(f"Incremental free orders: {results['incremental_free_orders']:.0f}")
    print(f"Shipping cost (total):   {results['shipping_cost_total']:,.0f} DKK ({results['months_after']} months)")
    print(f"Shipping cost (monthly): {results['shipping_cost_monthly']:,.0f} DKK")

    # P&L Summary
    print(f"\n{'='*80}")
    print("SEGMENT P&L SUMMARY (Monthly)")
    print(f"{'='*80}")
    print(f"Monthly Profit Lift:     {results['monthly_profit_lift']:+.2f} DKK per customer")
    print(f"× {results['customers']:,} customers =        {results['total_monthly_value']:+,.0f} DKK/month")
    print(f"- Shipping Cost:         {results['shipping_cost_monthly']:,.0f} DKK/month")
    print(f"= NET MONTHLY VALUE:     {results['total_monthly_value_net']:+,.0f} DKK/month")

    return results


def main():
    # Load data
    orders = load_order_data()
    cashback_df = load_cashback_data()
    club_order_numbers = get_club_orders()

    if len(club_order_numbers) == 0:
        print("No Club orders found!")
        return

    # Identify segments
    best_customers, medium_customers, all_club = identify_segments(orders, club_order_numbers)

    # Calculate metrics for each segment
    best_results = calculate_segment_metrics(orders, cashback_df, best_customers, "BEST CUSTOMERS")
    print_segment_results(best_results)

    medium_results = calculate_segment_metrics(orders, cashback_df, medium_customers, "MEDIUM CUSTOMERS")
    print_segment_results(medium_results)

    # Summary
    print("\n" + "=" * 80)
    print("COMBINED SEGMENT SUMMARY")
    print("=" * 80)

    total_customers = best_results['customers'] + medium_results['customers']
    total_monthly_value = best_results['total_monthly_value'] + medium_results['total_monthly_value']
    total_shipping_cost = best_results['shipping_cost_monthly'] + medium_results['shipping_cost_monthly']
    total_net = total_monthly_value - total_shipping_cost

    print(f"""
                              BEST           MEDIUM         COMBINED
    Customers:                {best_results['customers']:>10,}     {medium_results['customers']:>10,}     {total_customers:>10,}

    Frequency Change:         {best_results['frequency_change_pct']:>+10.1f}%    {medium_results['frequency_change_pct']:>+10.1f}%
    AOV Change:               {best_results['aov_change_pct']:>+10.1f}%    {medium_results['aov_change_pct']:>+10.1f}%
    Profit/Order Change:      {best_results['profit_per_order_change_pct']:>+10.1f}%    {medium_results['profit_per_order_change_pct']:>+10.1f}%
    Monthly Profit Change:    {best_results['monthly_profit_change_pct']:>+10.1f}%    {medium_results['monthly_profit_change_pct']:>+10.1f}%

    Monthly Profit Lift:      {best_results['monthly_profit_lift']:>+10.2f}     {medium_results['monthly_profit_lift']:>+10.2f}     DKK/customer

    Total Monthly Uplift:     {best_results['total_monthly_value']:>+10,.0f}     {medium_results['total_monthly_value']:>+10,.0f}     {total_monthly_value:>+10,.0f} DKK
    Shipping Cost:            {best_results['shipping_cost_monthly']:>10,.0f}     {medium_results['shipping_cost_monthly']:>10,.0f}     {total_shipping_cost:>10,.0f} DKK
    ─────────────────────────────────────────────────────────────────────────────────
    NET MONTHLY VALUE:        {best_results['total_monthly_value_net']:>+10,.0f}     {medium_results['total_monthly_value_net']:>+10,.0f}     {total_net:>+10,.0f} DKK
    """)

    # Fresh customers reference
    print("\n" + "=" * 80)
    print("FRESH CUSTOMERS (from existing analysis)")
    print("=" * 80)
    print("""
    Conversion Window:        60 days
    Before Rate:              8.06%
    After Rate:               7.21%
    Change:                   -0.85pp

    Monthly New Customers:    34,026
    Extra Conversions:        -289 (lost)
    Profit/Conversion:        197 DKK

    Monthly Value:            -57,005 DKK
    """)

    # Overall P&L
    print("\n" + "=" * 80)
    print("OVERALL SEGMENT-ISOLATED P&L (Monthly)")
    print("=" * 80)

    fresh_value = -57005
    overall_net = total_net + fresh_value

    print(f"""
    Best Customers:           {best_results['total_monthly_value_net']:>+15,.0f} DKK
    Medium Customers:         {medium_results['total_monthly_value_net']:>+15,.0f} DKK
    Fresh Customers:          {fresh_value:>+15,.0f} DKK
    ───────────────────────────────────────────────────────
    TOTAL MONTHLY NET:        {overall_net:>+15,.0f} DKK

    Annual Estimate:          {overall_net * 12:>+15,.0f} DKK
    """)

    # Clean summary table for dashboard
    print("\n" + "=" * 100)
    print("CLEAN SUMMARY TABLE (for dashboard)")
    print("=" * 100)
    print(f"""
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              SEGMENT-ISOLATED P&L SUMMARY                                          │
├──────────────────────┬────────────────────────────────┬────────────────────────────────┬───────────┤
│ Metric               │ BEST CUSTOMERS ({best_results['customers']:,})        │ MEDIUM CUSTOMERS ({medium_results['customers']:,})      │ Change    │
├──────────────────────┼───────────┬───────────┬────────┼───────────┬───────────┬────────┼───────────┤
│                      │ Before    │ After     │ Δ      │ Before    │ After     │ Δ      │           │
├──────────────────────┼───────────┼───────────┼────────┼───────────┼───────────┼────────┼───────────┤
│ Items/Order (AOQ)    │ {best_results['before_items_per_order']:>9.2f} │ {best_results['after_items_per_order']:>9.2f} │        │ {medium_results['before_items_per_order']:>9.2f} │ {medium_results['after_items_per_order']:>9.2f} │        │           │
│ Shipping/Order (DKK) │ {best_results['before_shipping_per_order']:>9.2f} │ {best_results['after_shipping_per_order']:>9.2f} │        │ {medium_results['before_shipping_per_order']:>9.2f} │ {medium_results['after_shipping_per_order']:>9.2f} │        │           │
│ Free Shipping %      │ {best_results['before_free_shipping_pct']:>8.1f}% │ {best_results['after_free_shipping_pct']:>8.1f}% │ {best_results['after_free_shipping_pct']-best_results['before_free_shipping_pct']:>+5.1f}pp │ {medium_results['before_free_shipping_pct']:>8.1f}% │ {medium_results['after_free_shipping_pct']:>8.1f}% │ {medium_results['after_free_shipping_pct']-medium_results['before_free_shipping_pct']:>+5.1f}pp │           │
│ Frequency (orders/mo)│ {best_results['before_frequency']:>9.3f} │ {best_results['after_frequency']:>9.3f} │ {best_results['frequency_change_pct']:>+5.1f}% │ {medium_results['before_frequency']:>9.3f} │ {medium_results['after_frequency']:>9.3f} │{medium_results['frequency_change_pct']:>+6.1f}% │           │
│ CB Usage Rate        │ {best_results['before_cashback_usage_rate']:>8.1f}% │ {best_results['after_cashback_usage_rate']:>8.1f}% │        │ {medium_results['before_cashback_usage_rate']:>8.1f}% │ {medium_results['after_cashback_usage_rate']:>8.1f}% │        │           │
│ Median CB/Order      │ {best_results['before_median_cashback_per_cb_order']:>9.2f} │ {best_results['after_median_cashback_per_cb_order']:>9.2f} │        │ {medium_results['before_median_cashback_per_cb_order']:>9.2f} │ {medium_results['after_median_cashback_per_cb_order']:>9.2f} │        │           │
│ AOV (DKK)            │ {best_results['before_aov']:>9.2f} │ {best_results['after_aov']:>9.2f} │ {best_results['aov_change_pct']:>+5.1f}% │ {medium_results['before_aov']:>9.2f} │ {medium_results['after_aov']:>9.2f} │ {medium_results['aov_change_pct']:>+5.1f}% │           │
│ Profit/Order (DKK)   │ {best_results['before_profit_per_order']:>9.2f} │ {best_results['after_profit_per_order']:>9.2f} │ {best_results['profit_per_order_change_pct']:>+5.1f}% │ {medium_results['before_profit_per_order']:>9.2f} │ {medium_results['after_profit_per_order']:>9.2f} │ {medium_results['profit_per_order_change_pct']:>+5.1f}% │           │
│ Monthly Profit (DKK) │ {best_results['before_monthly_profit']:>9.2f} │ {best_results['after_monthly_profit']:>9.2f} │ {best_results['monthly_profit_change_pct']:>+5.1f}% │ {medium_results['before_monthly_profit']:>9.2f} │ {medium_results['after_monthly_profit']:>9.2f} │{medium_results['monthly_profit_change_pct']:>+6.1f}% │           │
├──────────────────────┴───────────┴───────────┴────────┴───────────┴───────────┴────────┴───────────┤
│ SEGMENT COSTS                                                                                      │
├──────────────────────┬─────────────────────────────────────────────────────────────────────────────┤
│ Shipping Cost/Month  │ {best_results['shipping_cost_monthly']:>10,.0f} DKK                              │ {medium_results['shipping_cost_monthly']:>10,.0f} DKK                              │
│ Total CB Redeemed    │ {best_results['after_total_cashback']:>10,.0f} DKK ({best_results['months_after']:.0f} mo)            │ {medium_results['after_total_cashback']:>10,.0f} DKK ({medium_results['months_after']:.0f} mo)            │
├──────────────────────┴─────────────────────────────────────────────────────────────────────────────┤
│ SEGMENT VALUE                                                                                      │
├──────────────────────┬─────────────────────────────────────────────────────────────────────────────┤
│ Monthly Profit Lift  │ {best_results['monthly_profit_lift']:>+10.2f} DKK/customer                     │ {medium_results['monthly_profit_lift']:>+10.2f} DKK/customer                     │
│ Total Monthly Uplift │ {best_results['total_monthly_value']:>+10,.0f} DKK                              │ {medium_results['total_monthly_value']:>+10,.0f} DKK                              │
│ NET Monthly Value    │ {best_results['total_monthly_value_net']:>+10,.0f} DKK                              │ {medium_results['total_monthly_value_net']:>+10,.0f} DKK                              │
└──────────────────────┴─────────────────────────────────────────────────────────────────────────────┘

Note: Cashback is ALREADY in profit figures (reduces revenue at redemption).
      Shipping cost = incremental free shipping orders × avg shipping fee (39 DKK).
""")


if __name__ == "__main__":
    main()
