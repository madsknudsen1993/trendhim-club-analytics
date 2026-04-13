#!/usr/bin/env python3
"""
Fresh Customer Analysis: 1st → 2nd Order Conversion Rates

Analyzes whether the Club ecosystem drives more first-time customers
to place their second order.

Compares:
- Before Club: Jan 2023 - Mar 2025 (pre-launch baseline)
- After Club: Apr 2025 - Jan 2026 (Club period)

Key Metric: % of new customers who place 2nd order within 60 days
"""

import pandas as pd
import glob
import json
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
CSV_DIR = Path(__file__).parent.parent / "PowerBi  - Order_history "
OUTPUT_FILE = Path(__file__).parent / "fresh_customer_results.json"

# Date boundaries
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
BEFORE_START = pd.Timestamp("2023-01-01")
BEFORE_END = pd.Timestamp("2025-03-31")  # End of before period
AFTER_START = pd.Timestamp("2025-04-01")
AFTER_END = pd.Timestamp("2026-01-31")  # End of after period

# Conversion window
CONVERSION_WINDOW_DAYS = 60


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

    # Remove duplicates based on ORDER_NUMBER
    combined = combined.drop_duplicates(subset=["ORDER_NUMBER"])
    print(f"\nTotal unique orders: {len(combined):,}")

    return combined


def prepare_data(df):
    """Clean and prepare the data."""
    # Convert date column
    df["order_date"] = pd.to_datetime(df["COMPLETED_AT_DATE"])

    # Filter to valid orders (Complete state, not internal/resend/exchange)
    df = df[
        (df["ORDER_STATE"] == "Complete") &
        (df["IS_INTERNAL_ORDER"] == False) &
        (df["IS_ORDER_RESEND"] == False) &
        (df["IS_AN_ORDER_EXCHANGE"] == False)
    ].copy()

    print(f"Valid orders after standard filtering: {len(df):,}")

    # CRITICAL: Exclude CE orders (system orders, not customer purchases)
    # CE orders are identified by ORDER_NUMBER starting with 'CE'
    ce_orders_before = len(df)
    df = df[~df["ORDER_NUMBER"].astype(str).str.startswith("CE")].copy()
    ce_orders_excluded = ce_orders_before - len(df)

    print(f"CE orders excluded: {ce_orders_excluded:,}")
    print(f"Valid orders after CE exclusion: {len(df):,}")

    return df


def identify_first_and_second_orders(df):
    """
    For each customer, identify:
    1. Their first order date
    2. Their second order date (if any)
    3. Days between 1st and 2nd order
    """
    # Sort by customer and date
    df = df.sort_values(["UNIQUE_CUSTOMER_ID", "order_date"])

    # Group by customer and get their order history
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

    # Flag if converted within 60 days
    customer_orders["converted_60d"] = customer_orders["days_to_second"].apply(
        lambda x: x is not None and x <= CONVERSION_WINDOW_DAYS
    )

    # Get profit from second order (if exists)
    customer_orders["second_order_profit"] = customer_orders.apply(
        lambda row: row["PROFIT_TRACKING_TOTAL_PROFIT_DKK"][1]
        if len(row["PROFIT_TRACKING_TOTAL_PROFIT_DKK"]) >= 2 else None,
        axis=1
    )

    print(f"\nTotal unique customers: {len(customer_orders):,}")
    print(f"Customers with 2+ orders: {(customer_orders['order_count'] >= 2).sum():,}")

    return customer_orders


def analyze_period(customer_orders, period_start, period_end, period_name):
    """
    Analyze conversion rates for customers whose FIRST order was in the given period.
    Only include customers whose first order allows for full 60-day observation window.
    """
    # Filter to customers whose first order was in this period
    # AND who had enough time for the 60-day window to complete
    observation_cutoff = period_end - timedelta(days=CONVERSION_WINDOW_DAYS)

    period_customers = customer_orders[
        (customer_orders["first_order_date"] >= period_start) &
        (customer_orders["first_order_date"] <= observation_cutoff)
    ].copy()

    total_new = len(period_customers)
    converted = period_customers["converted_60d"].sum()
    conversion_rate = (converted / total_new * 100) if total_new > 0 else 0

    # Average days to second order (for those who converted)
    converted_customers = period_customers[period_customers["converted_60d"]]
    avg_days = converted_customers["days_to_second"].mean() if len(converted_customers) > 0 else None

    # Average profit from second orders
    second_order_profits = converted_customers["second_order_profit"].dropna()
    avg_second_order_profit = second_order_profits.mean() if len(second_order_profits) > 0 else None

    print(f"\n{period_name}:")
    print(f"  Period: {period_start.date()} to {observation_cutoff.date()}")
    print(f"  New customers (1st order): {total_new:,}")
    print(f"  Converted within 60 days: {converted:,}")
    print(f"  Conversion rate: {conversion_rate:.2f}%")
    if avg_days:
        print(f"  Avg days to 2nd order: {avg_days:.1f}")
    if avg_second_order_profit:
        print(f"  Avg profit from 2nd order: {avg_second_order_profit:.2f} DKK")

    return {
        "period_name": period_name,
        "period_start": str(period_start.date()),
        "period_end": str(observation_cutoff.date()),
        "new_customers": int(total_new),
        "converted_60d": int(converted),
        "conversion_rate": round(conversion_rate, 2),
        "avg_days_to_second": round(avg_days, 1) if avg_days else None,
        "avg_second_order_profit": round(avg_second_order_profit, 2) if avg_second_order_profit else None
    }


def calculate_monthly_impact(before_results, after_results):
    """Calculate the monthly impact of improved conversion rates."""

    # Conversion rate lift in percentage points
    rate_lift_pp = after_results["conversion_rate"] - before_results["conversion_rate"]

    # Monthly new customers in after period
    after_months = 10  # Apr 2025 - Jan 2026
    monthly_new_customers = after_results["new_customers"] / after_months

    # Extra conversions per month due to lift
    extra_conversions_per_month = monthly_new_customers * (rate_lift_pp / 100)

    # Profit per converted customer (use after period average)
    profit_per_conversion = after_results["avg_second_order_profit"] or 0

    # Monthly value
    monthly_value = extra_conversions_per_month * profit_per_conversion

    return {
        "rate_lift_pp": round(rate_lift_pp, 2),
        "monthly_new_customers": round(monthly_new_customers, 0),
        "extra_conversions_per_month": round(extra_conversions_per_month, 1),
        "profit_per_conversion": round(profit_per_conversion, 2),
        "monthly_value": round(monthly_value, 2)
    }


def main():
    print("=" * 60)
    print("Fresh Customer Analysis: 1st → 2nd Order Conversion")
    print("=" * 60)

    # Load data
    df = load_all_orders()
    df = prepare_data(df)

    # Identify first and second orders
    customer_orders = identify_first_and_second_orders(df)

    # Analyze before period
    before_results = analyze_period(
        customer_orders,
        BEFORE_START,
        BEFORE_END,
        "Before Club (Jan 2023 - Mar 2025)"
    )

    # Analyze after period
    after_results = analyze_period(
        customer_orders,
        AFTER_START,
        AFTER_END,
        "After Club (Apr 2025 - Jan 2026)"
    )

    # Calculate impact
    impact = calculate_monthly_impact(before_results, after_results)

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"\nConversion Rate Change: {impact['rate_lift_pp']:+.2f} pp")
    print(f"  Before: {before_results['conversion_rate']:.2f}%")
    print(f"  After: {after_results['conversion_rate']:.2f}%")
    print(f"\nMonthly Impact:")
    print(f"  New customers/month: {impact['monthly_new_customers']:,.0f}")
    print(f"  Extra conversions/month: {impact['extra_conversions_per_month']:+.1f}")
    print(f"  Profit per conversion: {impact['profit_per_conversion']:,.2f} DKK")
    print(f"  Estimated monthly value: {impact['monthly_value']:+,.2f} DKK")

    # Save results
    results = {
        "generated_at": datetime.now().isoformat(),
        "before_period": before_results,
        "after_period": after_results,
        "impact": impact
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to: {OUTPUT_FILE}")

    return results


if __name__ == "__main__":
    main()
