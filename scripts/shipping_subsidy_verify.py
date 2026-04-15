#!/usr/bin/env python3
"""
Verify shipping subsidy calculation using CLUB ORDERS ONLY
with proper country-specific thresholds.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
ANALYSIS_END = pd.Timestamp("2026-01-31")

# Country-specific thresholds (in local currency) - from user's spreadsheet
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


def get_club_orders():
    """Get Club order numbers from database."""
    print("\nGetting Club orders from database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT DISTINCT order_number
        FROM "order"
        WHERE customer_group_key = 'club'
        AND created_at >= '2025-04-01'
        AND created_at <= '2026-01-31'
    """)
    club_order_numbers = set(row['order_number'] for row in cursor.fetchall())
    cursor.close()
    conn.close()
    print(f"Club orders from DB: {len(club_order_numbers):,}")
    return club_order_numbers


def extract_country(order_number):
    """Extract country code from order number prefix."""
    order_str = str(order_number).upper()
    for prefix in THRESHOLDS.keys():
        if order_str.startswith(prefix):
            return prefix
    return 'UNKNOWN'


def get_subsidy_zone_dkk(country):
    """Get subsidy zone converted to DKK for a country."""
    if country not in THRESHOLDS:
        return None, None

    threshold = THRESHOLDS[country]
    currency = threshold['currency']
    fx_rate = FX_RATES.get(currency, 1)

    club_dkk = threshold['club'] * fx_rate
    normal_dkk = threshold['normal'] * fx_rate

    return club_dkk, normal_dkk


def main():
    orders = load_orders()
    club_order_numbers = get_club_orders()

    # Filter to Club period
    club_period = orders[
        (orders['COMPLETED_AT_DATE'] >= CLUB_LAUNCH_DATE) &
        (orders['COMPLETED_AT_DATE'] <= ANALYSIS_END)
    ].copy()

    # Filter to CLUB ORDERS ONLY
    club_orders = club_period[club_period['ORDER_NUMBER'].isin(club_order_numbers)].copy()
    print(f"\nClub orders in analysis period: {len(club_orders):,}")

    # Extract country
    club_orders['country'] = club_orders['ORDER_NUMBER'].apply(extract_country)

    # Flag free shipping
    club_orders['is_free_shipping'] = club_orders['SHIPPING_GROSS_AMOUNT_DKK'] == 0

    # Show country distribution for Club orders
    print("\n" + "=" * 80)
    print("CLUB ORDERS BY COUNTRY")
    print("=" * 80)
    country_dist = club_orders['country'].value_counts()
    for country, count in country_dist.head(10).items():
        pct = count / len(club_orders) * 100
        print(f"  {country}: {count:>6,} ({pct:>5.1f}%)")

    # METHOD 1: Hardcoded 199-449 DKK (current approach)
    print("\n" + "=" * 80)
    print("METHOD 1: HARDCODED 199-449 DKK (Current Approach)")
    print("=" * 80)

    method1_zone = club_orders[
        (club_orders['GROSS_AMOUNT_DKK'] >= 199) &
        (club_orders['GROSS_AMOUNT_DKK'] < 449)
    ]
    method1_free = method1_zone[method1_zone['is_free_shipping']]

    print(f"Orders in 199-449 DKK zone: {len(method1_zone):,}")
    print(f"Free shipping in zone: {len(method1_free):,}")
    print(f"Free rate: {len(method1_free)/len(method1_zone)*100:.1f}%")
    print(f"Estimated subsidy (@30 DKK): {len(method1_free) * 30:,} DKK")

    # METHOD 2: Country-specific thresholds
    print("\n" + "=" * 80)
    print("METHOD 2: COUNTRY-SPECIFIC THRESHOLDS (Correct Approach)")
    print("=" * 80)

    def is_in_country_subsidy_zone(row):
        country = row['country']
        if country not in THRESHOLDS:
            return False

        club_dkk, normal_dkk = get_subsidy_zone_dkk(country)
        if club_dkk is None:
            return False

        return club_dkk <= row['GROSS_AMOUNT_DKK'] < normal_dkk

    club_orders['in_country_subsidy'] = club_orders.apply(is_in_country_subsidy_zone, axis=1)

    method2_zone = club_orders[club_orders['in_country_subsidy']]
    method2_free = method2_zone[method2_zone['is_free_shipping']]

    print(f"Orders in country-specific zone: {len(method2_zone):,}")
    print(f"Free shipping in zone: {len(method2_free):,}")
    print(f"Free rate: {len(method2_free)/len(method2_zone)*100:.1f}%" if len(method2_zone) > 0 else "N/A")
    print(f"Estimated subsidy (@30 DKK): {len(method2_free) * 30:,} DKK")

    # COMPARISON
    print("\n" + "=" * 80)
    print("COMPARISON")
    print("=" * 80)
    print(f"""
Dashboard shows:
  - Orders in subsidy zone: 27,169
  - Total subsidy: 815,070 DKK
  - Avg cost/order: ~30 DKK

Method 1 (Hardcoded 199-449 DKK):
  - Orders in zone: {len(method1_zone):,}
  - Free in zone: {len(method1_free):,}
  - Subsidy (@30): {len(method1_free) * 30:,} DKK

Method 2 (Country-specific):
  - Orders in zone: {len(method2_zone):,}
  - Free in zone: {len(method2_free):,}
  - Subsidy (@30): {len(method2_free) * 30:,} DKK

Difference:
  - Method 1 vs Dashboard: {len(method1_free) - 27169:+,} orders
  - Method 2 vs Dashboard: {len(method2_free) - 27169:+,} orders
""")

    # Breakdown by country for Method 2
    print("\n" + "=" * 80)
    print("BREAKDOWN BY COUNTRY (Method 2 - Country-specific)")
    print("=" * 80)

    for country in ['DK', 'SE', 'NO', 'DE', 'GB', 'US', 'PL', 'NL']:
        country_orders = club_orders[club_orders['country'] == country]
        if len(country_orders) < 50:
            continue

        club_dkk, normal_dkk = get_subsidy_zone_dkk(country)
        if club_dkk is None:
            continue

        in_zone = country_orders[country_orders['in_country_subsidy']]
        free_in_zone = in_zone[in_zone['is_free_shipping']]

        threshold = THRESHOLDS[country]
        print(f"\n{country} ({len(country_orders):,} Club orders):")
        print(f"  Local thresholds: {threshold['club']}-{threshold['normal']} {threshold['currency']}")
        print(f"  DKK equivalent: {club_dkk:.0f}-{normal_dkk:.0f} DKK")
        print(f"  Orders in zone: {len(in_zone):,} ({len(in_zone)/len(country_orders)*100:.1f}%)")
        print(f"  Free in zone: {len(free_in_zone):,} ({len(free_in_zone)/len(in_zone)*100:.1f}%)" if len(in_zone) > 0 else "  No orders in zone")


if __name__ == "__main__":
    main()
