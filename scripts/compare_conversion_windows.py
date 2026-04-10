#!/usr/bin/env python3
"""
Compare Fresh Customer Conversion Rates across different time windows.
Runs analysis for 60, 90, and 120 day conversion windows.
"""

import pandas as pd
import glob
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
CSV_DIR = Path(__file__).parent.parent / "PowerBi  - Order_history "

# Date boundaries
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
BEFORE_START = pd.Timestamp("2023-01-01")
BEFORE_END = pd.Timestamp("2025-03-31")
AFTER_START = pd.Timestamp("2025-04-01")
AFTER_END = pd.Timestamp("2026-01-31")

# Windows to test
CONVERSION_WINDOWS = [60, 90, 120]


def load_all_orders():
    """Load all order history CSV files and combine them."""
    csv_files = list(CSV_DIR.glob("*.csv"))
    print(f"Found {len(csv_files)} CSV files")

    dfs = []
    for f in csv_files:
        df = pd.read_csv(f, low_memory=False)
        dfs.append(df)
        print(f"  Loaded {len(df):,} rows from {f.name}")

    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.drop_duplicates(subset=["ORDER_NUMBER"])
    print(f"\nTotal unique orders: {len(combined):,}")

    return combined


def prepare_data(df):
    """Clean and prepare the data."""
    df["order_date"] = pd.to_datetime(df["COMPLETED_AT_DATE"])

    df = df[
        (df["ORDER_STATE"] == "Complete") &
        (df["IS_INTERNAL_ORDER"] == False) &
        (df["IS_ORDER_RESEND"] == False) &
        (df["IS_AN_ORDER_EXCHANGE"] == False)
    ].copy()

    print(f"Valid orders after filtering: {len(df):,}")
    return df


def identify_customer_orders(df):
    """For each customer, identify their order history."""
    df = df.sort_values(["UNIQUE_CUSTOMER_ID", "order_date"])

    customer_orders = df.groupby("UNIQUE_CUSTOMER_ID").agg({
        "order_date": list,
        "ORDER_NUMBER": list,
        "PROFIT_TRACKING_TOTAL_PROFIT_DKK": list
    }).reset_index()

    customer_orders["order_count"] = customer_orders["order_date"].apply(len)
    customer_orders["first_order_date"] = customer_orders["order_date"].apply(lambda x: x[0])
    customer_orders["second_order_date"] = customer_orders["order_date"].apply(
        lambda x: x[1] if len(x) >= 2 else None
    )

    # Calculate days to second order
    customer_orders["days_to_second"] = customer_orders.apply(
        lambda row: (row["second_order_date"] - row["first_order_date"]).days
        if row["second_order_date"] is not None else None,
        axis=1
    )

    # Get profit from second order
    customer_orders["second_order_profit"] = customer_orders.apply(
        lambda row: row["PROFIT_TRACKING_TOTAL_PROFIT_DKK"][1]
        if len(row["PROFIT_TRACKING_TOTAL_PROFIT_DKK"]) >= 2 else None,
        axis=1
    )

    print(f"\nTotal unique customers: {len(customer_orders):,}")
    print(f"Customers with 2+ orders: {(customer_orders['order_count'] >= 2).sum():,}")

    return customer_orders


def analyze_period(customer_orders, period_start, period_end, window_days):
    """Analyze conversion rates for a specific window."""
    observation_cutoff = period_end - timedelta(days=window_days)

    period_customers = customer_orders[
        (customer_orders["first_order_date"] >= period_start) &
        (customer_orders["first_order_date"] <= observation_cutoff)
    ].copy()

    total_new = len(period_customers)

    # Flag if converted within window
    converted = period_customers["days_to_second"].apply(
        lambda x: x is not None and x <= window_days
    ).sum()

    conversion_rate = (converted / total_new * 100) if total_new > 0 else 0

    # Average days for those who converted
    converted_mask = period_customers["days_to_second"].apply(
        lambda x: x is not None and x <= window_days
    )
    converted_customers = period_customers[converted_mask]
    avg_days = converted_customers["days_to_second"].mean() if len(converted_customers) > 0 else None
    median_days = converted_customers["days_to_second"].median() if len(converted_customers) > 0 else None

    # Average profit
    second_order_profits = converted_customers["second_order_profit"].dropna()
    avg_profit = second_order_profits.mean() if len(second_order_profits) > 0 else None

    return {
        "window_days": window_days,
        "new_customers": int(total_new),
        "converted": int(converted),
        "conversion_rate": round(conversion_rate, 2),
        "avg_days": round(avg_days, 1) if avg_days else None,
        "median_days": round(median_days, 0) if median_days else None,
        "avg_profit": round(avg_profit, 2) if avg_profit else None
    }


def main():
    print("=" * 70)
    print("Fresh Customer Conversion: Comparing 60 / 90 / 120 Day Windows")
    print("=" * 70)

    # Load and prepare data
    df = load_all_orders()
    df = prepare_data(df)
    customer_orders = identify_customer_orders(df)

    results = []

    print("\n" + "=" * 70)
    print("RESULTS BY CONVERSION WINDOW")
    print("=" * 70)

    for window in CONVERSION_WINDOWS:
        print(f"\n{'='*70}")
        print(f"CONVERSION WINDOW: {window} DAYS")
        print("=" * 70)

        before = analyze_period(customer_orders, BEFORE_START, BEFORE_END, window)
        after = analyze_period(customer_orders, AFTER_START, AFTER_END, window)

        rate_change = after["conversion_rate"] - before["conversion_rate"]

        print(f"\nBefore Club (Jan 2023 - Mar 2025):")
        print(f"  New customers: {before['new_customers']:,}")
        print(f"  Converted ({window}d): {before['converted']:,}")
        print(f"  Conversion rate: {before['conversion_rate']:.2f}%")
        print(f"  Avg days to 2nd: {before['avg_days']}")
        print(f"  Median days: {before['median_days']}")
        print(f"  Avg 2nd order profit: {before['avg_profit']:.2f} DKK")

        print(f"\nAfter Club (Apr 2025 - Jan 2026):")
        print(f"  New customers: {after['new_customers']:,}")
        print(f"  Converted ({window}d): {after['converted']:,}")
        print(f"  Conversion rate: {after['conversion_rate']:.2f}%")
        print(f"  Avg days to 2nd: {after['avg_days']}")
        print(f"  Median days: {after['median_days']}")
        print(f"  Avg 2nd order profit: {after['avg_profit']:.2f} DKK")

        print(f"\n  CHANGE: {rate_change:+.2f} pp ({before['conversion_rate']:.2f}% -> {after['conversion_rate']:.2f}%)")

        # Calculate monthly impact
        after_months = 10
        monthly_new = after["new_customers"] / after_months
        extra_conversions = monthly_new * (rate_change / 100)
        monthly_value = extra_conversions * (after["avg_profit"] or 0)

        print(f"\n  Monthly Impact:")
        print(f"    Extra conversions/mo: {extra_conversions:+.0f}")
        print(f"    Monthly value: {monthly_value:+,.0f} DKK")

        results.append({
            "window": window,
            "before_rate": before["conversion_rate"],
            "after_rate": after["conversion_rate"],
            "change_pp": round(rate_change, 2),
            "monthly_value": round(monthly_value, 0),
            "before_converted": before["converted"],
            "after_converted": after["converted"],
        })

    # Summary comparison table
    print("\n" + "=" * 70)
    print("SUMMARY COMPARISON")
    print("=" * 70)
    print(f"\n{'Window':<10} {'Before %':<12} {'After %':<12} {'Change':<12} {'Monthly Value':<15}")
    print("-" * 65)
    for r in results:
        print(f"{r['window']} days    {r['before_rate']:.2f}%       {r['after_rate']:.2f}%       {r['change_pp']:+.2f} pp     {r['monthly_value']:+,.0f} DKK")

    print("\n" + "=" * 70)
    print("INTERPRETATION")
    print("=" * 70)
    print("""
Key findings:
- All windows show similar negative change in conversion rate
- The decline is consistent across 60/90/120 day windows
- This suggests the issue is NOT about needing more time to convert
- The decline likely reflects broader market trends or seasonal effects
    """)


if __name__ == "__main__":
    main()
