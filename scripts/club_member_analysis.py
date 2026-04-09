#!/usr/bin/env python3
"""
Club Member Before/After Analysis

This script specifically analyzes CLUB MEMBERS' behavior before and after joining.

Approach:
1. Load Order History (contains UNIQUE_CUSTOMER_ID - hash of email)
2. Connect to PostgreSQL database to get Club member orders
3. Link Club orders to Order History to identify Club member UNIQUE_CUSTOMER_IDs
4. For each Club member, find their join date (first Club order)
5. Analyze their behavior BEFORE join date vs AFTER join date
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration
ORDER_HISTORY_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/PowerBi  - Order_history ")
DATABASE_URL = "postgresql://localhost:5432/ecom_powers"
CLUB_LAUNCH_DATE = pd.Timestamp("2025-04-01")
OUTPUT_PATH = Path("/Users/madsknudsen/code/trendhim-club-analytics/scripts/analysis_results")

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

    print(f"Loaded {len(order_history):,} orders from {order_history['UNIQUE_CUSTOMER_ID'].nunique():,} customers")
    return order_history

def get_club_orders_from_db():
    """Get Club order numbers from the PostgreSQL database."""
    print("\nConnecting to PostgreSQL database...")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get orders where customer_group_key = 'club'
        query = """
        SELECT DISTINCT order_number, customer_id, created_at
        FROM "order"
        WHERE customer_group_key = 'club'
          AND created_at >= '2025-04-01'
        ORDER BY created_at
        """

        cursor.execute(query)
        results = cursor.fetchall()

        club_orders_df = pd.DataFrame(results)
        club_orders_df['created_at'] = pd.to_datetime(club_orders_df['created_at'])

        print(f"Found {len(club_orders_df):,} Club orders from database")
        print(f"Unique customer_ids: {club_orders_df['customer_id'].nunique():,}")

        cursor.close()
        conn.close()

        return club_orders_df

    except Exception as e:
        print(f"Database connection failed: {e}")
        print("Falling back to order number pattern matching...")
        return None

def identify_club_members_via_orders(order_history, club_orders_df):
    """
    Link Club orders from database to Order History to get UNIQUE_CUSTOMER_ID
    for each Club member.
    """
    print("\nLinking Club orders to Order History...")

    # Get the Club order numbers
    club_order_numbers = set(club_orders_df['order_number'].unique())
    print(f"Club order numbers to match: {len(club_order_numbers):,}")

    # Find these orders in Order History
    matched_orders = order_history[order_history['ORDER_NUMBER'].isin(club_order_numbers)].copy()
    print(f"Matched orders in Order History: {len(matched_orders):,}")

    # Get unique Club member customer IDs
    club_member_ids = matched_orders['UNIQUE_CUSTOMER_ID'].unique()
    print(f"Unique Club member UNIQUE_CUSTOMER_IDs found: {len(club_member_ids):,}")

    # Calculate join date for each Club member (first Club order date)
    club_join_dates = matched_orders.groupby('UNIQUE_CUSTOMER_ID')['COMPLETED_AT_DATE'].min().reset_index()
    club_join_dates.columns = ['UNIQUE_CUSTOMER_ID', 'club_join_date']

    print(f"Club join date range: {club_join_dates['club_join_date'].min()} to {club_join_dates['club_join_date'].max()}")

    return club_member_ids, club_join_dates

def analyze_club_members_before_after(order_history, club_member_ids, club_join_dates):
    """
    For each Club member, analyze their orders BEFORE vs AFTER their personal join date.
    """
    print("\n" + "="*60)
    print("CLUB MEMBER BEFORE/AFTER ANALYSIS")
    print("="*60)

    # Get all orders for Club members
    club_orders = order_history[order_history['UNIQUE_CUSTOMER_ID'].isin(club_member_ids)].copy()
    print(f"\nTotal orders from Club members: {len(club_orders):,}")

    # Merge with join dates
    club_orders = club_orders.merge(club_join_dates, on='UNIQUE_CUSTOMER_ID', how='left')

    # Split into before/after based on each customer's personal join date
    club_orders['is_after_join'] = club_orders['COMPLETED_AT_DATE'] >= club_orders['club_join_date']

    before_orders = club_orders[~club_orders['is_after_join']]
    after_orders = club_orders[club_orders['is_after_join']]

    print(f"\nOrders BEFORE joining Club: {len(before_orders):,}")
    print(f"Orders AFTER joining Club: {len(after_orders):,}")

    # Find Club members with orders in BOTH periods
    customers_before = set(before_orders['UNIQUE_CUSTOMER_ID'].unique())
    customers_after = set(after_orders['UNIQUE_CUSTOMER_ID'].unique())
    customers_both = customers_before & customers_after

    print(f"\nClub members with orders BEFORE joining: {len(customers_before):,}")
    print(f"Club members with orders AFTER joining: {len(customers_after):,}")
    print(f"Club members with orders in BOTH periods: {len(customers_both):,}")

    if len(customers_both) == 0:
        print("No Club members found with orders before joining!")
        return None

    # Analyze customers with both before and after data
    print(f"\n🎯 Analyzing {len(customers_both):,} Club members with pre-membership history...")

    # Filter to customers with both periods
    both_before = before_orders[before_orders['UNIQUE_CUSTOMER_ID'].isin(customers_both)]
    both_after = after_orders[after_orders['UNIQUE_CUSTOMER_ID'].isin(customers_both)]

    # Calculate per-customer metrics
    def calc_customer_metrics(orders_df, period_name):
        stats = orders_df.groupby('UNIQUE_CUSTOMER_ID').agg({
            'ORDER_NUMBER': 'count',
            'GROSS_AMOUNT_DKK': 'mean',
            'PROFIT_TRACKING_TOTAL_PROFIT_DKK': 'mean',
            'COMPLETED_AT_DATE': ['min', 'max']
        }).reset_index()
        stats.columns = ['customer_id', 'orders', 'aov', 'profit', 'first_order', 'last_order']

        # Calculate time span and monthly frequency
        stats['days_span'] = (stats['last_order'] - stats['first_order']).dt.days + 1
        stats['months_span'] = stats['days_span'] / 30.44
        stats['orders_per_month'] = stats.apply(
            lambda x: x['orders'] / max(x['months_span'], 1), axis=1
        )

        return stats

    before_stats = calc_customer_metrics(both_before, 'before')
    after_stats = calc_customer_metrics(both_after, 'after')

    # Merge for paired comparison
    comparison = before_stats.merge(
        after_stats,
        on='customer_id',
        suffixes=('_before', '_after')
    )

    # Calculate changes
    comparison['orders_change'] = comparison['orders_after'] - comparison['orders_before']
    comparison['aov_change'] = comparison['aov_after'] - comparison['aov_before']
    comparison['profit_change'] = comparison['profit_after'] - comparison['profit_before']
    comparison['frequency_change'] = comparison['orders_per_month_after'] - comparison['orders_per_month_before']

    # Print results
    print("\n" + "-"*60)
    print(f"RESULTS: {len(comparison):,} Club Members with Pre-Join History")
    print("-"*60)

    print("\n📊 BEFORE Joining Club:")
    print(f"   Total orders: {before_stats['orders'].sum():,}")
    print(f"   Avg orders per member: {before_stats['orders'].mean():.2f}")
    print(f"   Avg time span: {before_stats['days_span'].mean():.0f} days ({before_stats['months_span'].mean():.1f} months)")
    print(f"   Avg orders/month: {before_stats['orders_per_month'].mean():.3f}")
    print(f"   Avg AOV: {before_stats['aov'].mean():.2f} DKK")
    print(f"   Avg Profit/order: {before_stats['profit'].mean():.2f} DKK")

    print("\n📊 AFTER Joining Club:")
    print(f"   Total orders: {after_stats['orders'].sum():,}")
    print(f"   Avg orders per member: {after_stats['orders'].mean():.2f}")
    print(f"   Avg time span: {after_stats['days_span'].mean():.0f} days ({after_stats['months_span'].mean():.1f} months)")
    print(f"   Avg orders/month: {after_stats['orders_per_month'].mean():.3f}")
    print(f"   Avg AOV: {after_stats['aov'].mean():.2f} DKK")
    print(f"   Avg Profit/order: {after_stats['profit'].mean():.2f} DKK")

    # Percentage changes
    pct_orders = ((after_stats['orders'].mean() / before_stats['orders'].mean()) - 1) * 100
    pct_frequency = ((after_stats['orders_per_month'].mean() / before_stats['orders_per_month'].mean()) - 1) * 100
    pct_aov = ((after_stats['aov'].mean() / before_stats['aov'].mean()) - 1) * 100
    pct_profit = ((after_stats['profit'].mean() / before_stats['profit'].mean()) - 1) * 100

    print("\n📈 CHANGE (After vs Before):")
    print(f"   Orders per member: {pct_orders:+.1f}%")
    print(f"   Monthly frequency: {pct_frequency:+.1f}%")
    print(f"   Average Order Value: {pct_aov:+.1f}%")
    print(f"   Average Profit/order: {pct_profit:+.1f}%")

    print("\n📊 DISTRIBUTION OF FREQUENCY CHANGES:")
    improved = (comparison['frequency_change'] > 0.01).sum()
    same = ((comparison['frequency_change'] >= -0.01) & (comparison['frequency_change'] <= 0.01)).sum()
    declined = (comparison['frequency_change'] < -0.01).sum()

    print(f"   Frequency INCREASED: {improved:,} ({improved/len(comparison)*100:.1f}%)")
    print(f"   Frequency SIMILAR: {same:,} ({same/len(comparison)*100:.1f}%)")
    print(f"   Frequency DECREASED: {declined:,} ({declined/len(comparison)*100:.1f}%)")

    print("\n📊 AOV CHANGES:")
    aov_up = (comparison['aov_change'] > 10).sum()
    aov_same = ((comparison['aov_change'] >= -10) & (comparison['aov_change'] <= 10)).sum()
    aov_down = (comparison['aov_change'] < -10).sum()

    print(f"   AOV increased (>10 DKK): {aov_up:,} ({aov_up/len(comparison)*100:.1f}%)")
    print(f"   AOV similar (±10 DKK): {aov_same:,} ({aov_same/len(comparison)*100:.1f}%)")
    print(f"   AOV decreased (<-10 DKK): {aov_down:,} ({aov_down/len(comparison)*100:.1f}%)")

    return comparison, before_stats, after_stats

def main():
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

    # Load Order History
    order_history = load_order_history()

    # Get Club orders from database
    club_orders_df = get_club_orders_from_db()

    if club_orders_df is None or len(club_orders_df) == 0:
        print("Could not get Club orders from database. Please check connection.")
        return

    # Identify Club members via order number linking
    club_member_ids, club_join_dates = identify_club_members_via_orders(order_history, club_orders_df)

    # Run before/after analysis
    results = analyze_club_members_before_after(order_history, club_member_ids, club_join_dates)

    if results is not None:
        comparison, before_stats, after_stats = results

        # Save results
        comparison.to_csv(OUTPUT_PATH / "club_member_before_after.csv", index=False)
        before_stats.to_csv(OUTPUT_PATH / "club_member_before_stats.csv", index=False)
        after_stats.to_csv(OUTPUT_PATH / "club_member_after_stats.csv", index=False)

        print(f"\n✅ Results saved to: {OUTPUT_PATH}")

    print("\n" + "="*60)
    print("ANALYSIS COMPLETE")
    print("="*60)

if __name__ == "__main__":
    main()
