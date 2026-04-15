#!/usr/bin/env python3
"""
Test: Impact of using country-specific shipping thresholds vs hardcoded DKK thresholds.

Compares:
- Current approach: Hardcoded 199-449 DKK for all orders
- Correct approach: Country-specific thresholds in local currency
"""

import pandas as pd
import numpy as np
from pathlib import Path

ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
ANALYSIS_END = pd.Timestamp("2026-01-31")

# Country-specific thresholds (in local currency)
THRESHOLDS = {
    'DK': {'club': 199, 'normal': 449, 'currency': 'DKK'},
    'AT': {'club': 29, 'normal': 59, 'currency': 'EUR'},
    'BE': {'club': 29, 'normal': 59, 'currency': 'EUR'},
    'BG': {'club': 49, 'normal': 99, 'currency': 'BGN'},
    'CA': {'club': 39, 'normal': 75, 'currency': 'CAD'},
    'AU': {'club': 39, 'normal': 79, 'currency': 'AUD'},
    'CZ': {'club': 599, 'normal': 1199, 'currency': 'CZK'},
    'FI': {'club': 29, 'normal': 59, 'currency': 'EUR'},
    'FR': {'club': 25, 'normal': 49, 'currency': 'EUR'},
    'DE': {'club': 29, 'normal': 59, 'currency': 'EUR'},
    'GR': {'club': 25, 'normal': 49, 'currency': 'EUR'},
    'HU': {'club': 8999, 'normal': 17700, 'currency': 'HUF'},
    'IE': {'club': 29, 'normal': 59, 'currency': 'EUR'},
    'IT': {'club': 25, 'normal': 49, 'currency': 'EUR'},
    'NL': {'club': 25, 'normal': 39, 'currency': 'EUR'},
    'NZ': {'club': 59, 'normal': 125, 'currency': 'NZD'},
    'NO': {'club': 349, 'normal': 499, 'currency': 'NOK'},
    'PL': {'club': 119, 'normal': 179, 'currency': 'PLN'},
    'PT': {'club': 25, 'normal': 39, 'currency': 'EUR'},
    'RO': {'club': 129, 'normal': 249, 'currency': 'RON'},
    'SG': {'club': 49, 'normal': 105, 'currency': 'SGD'},
    'SK': {'club': 25, 'normal': 49, 'currency': 'EUR'},
    'ES': {'club': 25, 'normal': 39, 'currency': 'EUR'},
    'SE': {'club': 249, 'normal': 449, 'currency': 'SEK'},
    'CH': {'club': 39, 'normal': 75, 'currency': 'CHF'},
    'UK': {'club': 19.90, 'normal': 39, 'currency': 'GBP'},
    'GB': {'club': 19.90, 'normal': 39, 'currency': 'GBP'},
    'US': {'club': 29, 'normal': 59, 'currency': 'USD'},
}

# Exchange rates to DKK
FX_RATES = {
    'DKK': 1,
    'EUR': 7.45,
    'USD': 6.85,
    'GBP': 8.65,
    'SEK': 0.64,
    'NOK': 0.66,
    'AUD': 4.5,
    'CAD': 5,
    'SGD': 4.9973,
    'PLN': 1.7484,
    'HUF': 0.0183,
    'CHF': 7.9819,
    'NZD': 3.9281,
    'RON': 1.5,
    'BGN': 3.8137,
    'CZK': 0.29799,
}


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

    for col in ['SHIPPING_GROSS_AMOUNT_DKK', 'GROSS_AMOUNT_DKK']:
        orders[col] = pd.to_numeric(orders[col], errors='coerce').fillna(0)

    orders = orders[
        (orders['ORDER_STATE'] == 'Complete') &
        (orders['IS_INTERNAL_ORDER'] == False) &
        (orders['IS_ORDER_RESEND'] == False) &
        (orders['IS_AN_ORDER_EXCHANGE'] == False)
    ].copy()

    # Exclude CE orders
    orders = orders[~orders['ORDER_NUMBER'].astype(str).str.startswith('CE')].copy()

    print(f"Valid orders: {len(orders):,}")
    return orders


def extract_country(order_number):
    """Extract country code from order number prefix."""
    order_str = str(order_number).upper()
    # Try common prefixes
    for prefix in THRESHOLDS.keys():
        if order_str.startswith(prefix):
            return prefix
    # Default to DK if unknown
    return 'DK'


def get_local_amount(gross_dkk, country):
    """Convert DKK amount to local currency."""
    if country not in THRESHOLDS:
        return gross_dkk  # Assume DKK

    currency = THRESHOLDS[country]['currency']
    fx_rate = FX_RATES.get(currency, 1)

    if fx_rate == 0:
        return gross_dkk

    # Convert DKK to local: local = DKK / rate
    return gross_dkk / fx_rate


def is_in_subsidy_zone_correct(row):
    """Check if order is in subsidy zone using CORRECT country-specific thresholds."""
    country = row['country']
    if country not in THRESHOLDS:
        return False

    local_amount = row['local_amount']
    club_threshold = THRESHOLDS[country]['club']
    normal_threshold = THRESHOLDS[country]['normal']

    # Subsidy zone: between Club threshold and Normal threshold
    return club_threshold <= local_amount < normal_threshold


def is_in_subsidy_zone_current(row):
    """Check if order is in subsidy zone using CURRENT hardcoded approach (199-449 DKK)."""
    gross_dkk = row['GROSS_AMOUNT_DKK']
    return 199 <= gross_dkk < 449


def main():
    orders = load_orders()

    # Filter to Club period
    club_period = orders[
        (orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE) &
        (orders['COMPLETED_AT_DATE'] <= ANALYSIS_END)
    ].copy()

    print(f"\nOrders in Club period: {len(club_period):,}")

    # Extract country from order number
    club_period['country'] = club_period['ORDER_NUMBER'].apply(extract_country)

    # Calculate local amount
    club_period['local_amount'] = club_period.apply(
        lambda row: get_local_amount(row['GROSS_AMOUNT_DKK'], row['country']),
        axis=1
    )

    # Flag free shipping
    club_period['is_free_shipping'] = club_period['SHIPPING_GROSS_AMOUNT_DKK'] == 0

    # Compare methods
    club_period['in_subsidy_current'] = club_period.apply(is_in_subsidy_zone_current, axis=1)
    club_period['in_subsidy_correct'] = club_period.apply(is_in_subsidy_zone_correct, axis=1)

    # Show country distribution
    print("\n" + "=" * 80)
    print("ORDER DISTRIBUTION BY COUNTRY")
    print("=" * 80)
    country_dist = club_period['country'].value_counts()
    for country, count in country_dist.head(15).items():
        pct = count / len(club_period) * 100
        threshold = THRESHOLDS.get(country, {})
        print(f"  {country}: {count:>8,} ({pct:>5.1f}%) - Club: {threshold.get('club', '?')} {threshold.get('currency', '?')}, Normal: {threshold.get('normal', '?')}")

    # Compare subsidy zone counts
    print("\n" + "=" * 80)
    print("SUBSIDY ZONE COMPARISON")
    print("=" * 80)

    current_count = club_period['in_subsidy_current'].sum()
    correct_count = club_period['in_subsidy_correct'].sum()

    print(f"\nOrders in subsidy zone:")
    print(f"  Current method (199-449 DKK hardcoded): {current_count:,}")
    print(f"  Correct method (country-specific):      {correct_count:,}")
    print(f"  Difference: {correct_count - current_count:+,} ({(correct_count - current_count) / current_count * 100:+.1f}%)")

    # Check overlap
    both = (club_period['in_subsidy_current'] & club_period['in_subsidy_correct']).sum()
    only_current = (club_period['in_subsidy_current'] & ~club_period['in_subsidy_correct']).sum()
    only_correct = (~club_period['in_subsidy_current'] & club_period['in_subsidy_correct']).sum()

    print(f"\nOverlap analysis:")
    print(f"  In BOTH methods: {both:,}")
    print(f"  Only in CURRENT (false positives): {only_current:,}")
    print(f"  Only in CORRECT (missed by current): {only_correct:,}")

    # Free shipping rates in subsidy zone
    print("\n" + "=" * 80)
    print("FREE SHIPPING RATES IN SUBSIDY ZONE")
    print("=" * 80)

    current_subsidy = club_period[club_period['in_subsidy_current']]
    correct_subsidy = club_period[club_period['in_subsidy_correct']]

    current_free_rate = current_subsidy['is_free_shipping'].mean() * 100 if len(current_subsidy) > 0 else 0
    correct_free_rate = correct_subsidy['is_free_shipping'].mean() * 100 if len(correct_subsidy) > 0 else 0

    print(f"\nFree shipping rate in subsidy zone:")
    print(f"  Current method: {current_free_rate:.1f}%")
    print(f"  Correct method: {correct_free_rate:.1f}%")

    # Calculate shipping cost impact
    AVG_SHIPPING_FEE = 39  # DKK

    current_free_orders = current_subsidy['is_free_shipping'].sum()
    correct_free_orders = correct_subsidy['is_free_shipping'].sum()

    current_subsidy_cost = current_free_orders * AVG_SHIPPING_FEE
    correct_subsidy_cost = correct_free_orders * AVG_SHIPPING_FEE

    print("\n" + "=" * 80)
    print("SHIPPING SUBSIDY COST IMPACT")
    print("=" * 80)

    print(f"\nFree shipping orders in subsidy zone:")
    print(f"  Current method: {current_free_orders:,}")
    print(f"  Correct method: {correct_free_orders:,}")

    print(f"\nEstimated shipping subsidy (@ {AVG_SHIPPING_FEE} DKK avg):")
    print(f"  Current method: {current_subsidy_cost:,.0f} DKK")
    print(f"  Correct method: {correct_subsidy_cost:,.0f} DKK")
    print(f"  Difference: {correct_subsidy_cost - current_subsidy_cost:+,.0f} DKK ({(correct_subsidy_cost - current_subsidy_cost) / current_subsidy_cost * 100:+.1f}%)")

    # Breakdown by major countries
    print("\n" + "=" * 80)
    print("BREAKDOWN BY MAJOR COUNTRIES")
    print("=" * 80)

    for country in ['DK', 'SE', 'NO', 'DE', 'GB', 'US', 'NL', 'FR']:
        country_orders = club_period[club_period['country'] == country]
        if len(country_orders) < 100:
            continue

        in_subsidy = country_orders['in_subsidy_correct'].sum()
        free_in_subsidy = country_orders[country_orders['in_subsidy_correct']]['is_free_shipping'].sum()

        threshold = THRESHOLDS.get(country, {})

        print(f"\n{country} ({len(country_orders):,} orders):")
        print(f"  Thresholds: Club {threshold.get('club', '?')}, Normal {threshold.get('normal', '?')} {threshold.get('currency', '?')}")
        print(f"  In subsidy zone: {in_subsidy:,} ({in_subsidy/len(country_orders)*100:.1f}%)")
        print(f"  Free shipping in zone: {free_in_subsidy:,} ({free_in_subsidy/in_subsidy*100:.1f}% of zone)" if in_subsidy > 0 else "  No orders in zone")


if __name__ == "__main__":
    main()
