import { db } from "@/db";
import {
  orders,
  orderProfits,
  customerCashback,
} from "@/db/schema";
import { sql, eq, and, gte, lte, asc, count, sum, avg } from "drizzle-orm";

// FX rates to convert to DKK (same as original Streamlit dashboard)
const FX_RATES: Record<string, number> = {
  'DKK': 1.0,
  'EUR': 7.45,
  'SEK': 0.65,
  'NOK': 0.65,
  'GBP': 8.80,
  'USD': 7.00,
  'PLN': 1.75,
  'CZK': 0.31,
  'CHF': 7.80,
  'AUD': 4.50,
  'CAD': 5.20,
  'HUF': 0.019,
  'RON': 1.50,
  'BGN': 3.80,
  'NZD': 4.20,
  'SGD': 5.20,
};

// SQL FX CASE statement (reusable)
const FX_CASE_SQL = sql`CASE currency_code
  WHEN 'DKK' THEN 1.0
  WHEN 'EUR' THEN 7.45
  WHEN 'SEK' THEN 0.65
  WHEN 'NOK' THEN 0.65
  WHEN 'GBP' THEN 8.80
  WHEN 'USD' THEN 7.00
  WHEN 'PLN' THEN 1.75
  WHEN 'CZK' THEN 0.31
  WHEN 'CHF' THEN 7.80
  WHEN 'AUD' THEN 4.50
  WHEN 'CAD' THEN 5.20
  WHEN 'HUF' THEN 0.019
  WHEN 'RON' THEN 1.50
  WHEN 'BGN' THEN 3.80
  WHEN 'NZD' THEN 4.20
  WHEN 'SGD' THEN 5.20
  ELSE 1.0
END`;

// Club launch date (April 1, 2025)
const CLUB_LAUNCH_DATE = new Date('2025-04-01');

// Analysis period constants (from PDF)
const ANALYSIS_START = '2025-04-01';
const ANALYSIS_END = '2026-02-01'; // Exclusive upper bound

export interface DateFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface Filters extends DateFilter {
  countryCode?: string;
  currencyCode?: string;
  segment?: string;
}

// ============================================================================
// CONSERVATIVE CLUB ORDER APPROACH (from PDF)
// Only counts orders from verified cashback customers placed AFTER their join date
// This is the single source of truth for all Club metrics
// ============================================================================

// SQL CTE for conservative club orders - reusable across all queries
const CONSERVATIVE_CLUB_CTE = `
  WITH customer_join_dates AS (
    SELECT
      customer_id,
      MIN(recorded_at) as join_date
    FROM customer_cashback
    GROUP BY customer_id
  ),
  conservative_club_orders AS (
    SELECT
      o.order_number,
      o.customer_id,
      o.created_at,
      o.total_amount_cents,
      o.currency_code,
      o.country_code
    FROM "order" o
    INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
    WHERE o.customer_group_key = 'club'
      AND o.created_at >= '${ANALYSIS_START}'
      AND o.created_at < '${ANALYSIS_END}'
      AND o.created_at >= cjd.join_date
  )
`;

// SQL CTE for non-club orders (everything not in conservative_club_orders)
const NON_CLUB_CTE = `
  WITH customer_join_dates AS (
    SELECT
      customer_id,
      MIN(recorded_at) as join_date
    FROM customer_cashback
    GROUP BY customer_id
  ),
  conservative_club_order_numbers AS (
    SELECT o.order_number
    FROM "order" o
    INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
    WHERE o.customer_group_key = 'club'
      AND o.created_at >= '${ANALYSIS_START}'
      AND o.created_at < '${ANALYSIS_END}'
      AND o.created_at >= cjd.join_date
  ),
  non_club_orders AS (
    SELECT
      o.order_number,
      o.customer_id,
      o.created_at,
      o.total_amount_cents,
      o.currency_code,
      o.country_code
    FROM "order" o
    WHERE o.created_at >= '${ANALYSIS_START}'
      AND o.created_at < '${ANALYSIS_END}'
      AND o.order_number NOT IN (SELECT order_number FROM conservative_club_order_numbers)
  )
`;

// Get comprehensive KPIs matching the original Streamlit dashboard
// Uses CONSERVATIVE approach: only orders from verified cashback customers placed AFTER join date
export async function getKPIs(filters: Filters = {}) {
  try {
    // Conservative Club orders with FX conversion
    const clubQuery = sql`
      ${sql.raw(CONSERVATIVE_CLUB_CTE)}
      SELECT
        COUNT(*) as order_count,
        COUNT(DISTINCT customer_id) as customer_count,
        AVG(total_amount_cents / 100.0 * CASE currency_code
          WHEN 'DKK' THEN 1.0
          WHEN 'EUR' THEN 7.45
          WHEN 'SEK' THEN 0.65
          WHEN 'NOK' THEN 0.65
          WHEN 'GBP' THEN 8.80
          WHEN 'USD' THEN 7.00
          WHEN 'PLN' THEN 1.75
          WHEN 'CZK' THEN 0.31
          WHEN 'CHF' THEN 7.80
          WHEN 'AUD' THEN 4.50
          WHEN 'CAD' THEN 5.20
          WHEN 'HUF' THEN 0.019
          WHEN 'RON' THEN 1.50
          WHEN 'BGN' THEN 3.80
          WHEN 'NZD' THEN 4.20
          WHEN 'SGD' THEN 5.20
          ELSE 1.0
        END) as aov_dkk,
        SUM(total_amount_cents / 100.0 * CASE currency_code
          WHEN 'DKK' THEN 1.0
          WHEN 'EUR' THEN 7.45
          WHEN 'SEK' THEN 0.65
          WHEN 'NOK' THEN 0.65
          WHEN 'GBP' THEN 8.80
          WHEN 'USD' THEN 7.00
          WHEN 'PLN' THEN 1.75
          WHEN 'CZK' THEN 0.31
          WHEN 'CHF' THEN 7.80
          WHEN 'AUD' THEN 4.50
          WHEN 'CAD' THEN 5.20
          WHEN 'HUF' THEN 0.019
          WHEN 'RON' THEN 1.50
          WHEN 'BGN' THEN 3.80
          WHEN 'NZD' THEN 4.20
          WHEN 'SGD' THEN 5.20
          ELSE 1.0
        END) as revenue_dkk
      FROM conservative_club_orders
    `;

    // Non-Club orders (everything not in conservative club orders) with FX conversion
    const nonClubQuery = sql`
      ${sql.raw(NON_CLUB_CTE)}
      SELECT
        COUNT(*) as order_count,
        COUNT(DISTINCT customer_id) as customer_count,
        AVG(total_amount_cents / 100.0 * CASE currency_code
          WHEN 'DKK' THEN 1.0
          WHEN 'EUR' THEN 7.45
          WHEN 'SEK' THEN 0.65
          WHEN 'NOK' THEN 0.65
          WHEN 'GBP' THEN 8.80
          WHEN 'USD' THEN 7.00
          WHEN 'PLN' THEN 1.75
          WHEN 'CZK' THEN 0.31
          WHEN 'CHF' THEN 7.80
          WHEN 'AUD' THEN 4.50
          WHEN 'CAD' THEN 5.20
          WHEN 'HUF' THEN 0.019
          WHEN 'RON' THEN 1.50
          WHEN 'BGN' THEN 3.80
          WHEN 'NZD' THEN 4.20
          WHEN 'SGD' THEN 5.20
          ELSE 1.0
        END) as aov_dkk,
        SUM(total_amount_cents / 100.0 * CASE currency_code
          WHEN 'DKK' THEN 1.0
          WHEN 'EUR' THEN 7.45
          WHEN 'SEK' THEN 0.65
          WHEN 'NOK' THEN 0.65
          WHEN 'GBP' THEN 8.80
          WHEN 'USD' THEN 7.00
          WHEN 'PLN' THEN 1.75
          WHEN 'CZK' THEN 0.31
          WHEN 'CHF' THEN 7.80
          WHEN 'AUD' THEN 4.50
          WHEN 'CAD' THEN 5.20
          WHEN 'HUF' THEN 0.019
          WHEN 'RON' THEN 1.50
          WHEN 'BGN' THEN 3.80
          WHEN 'NZD' THEN 4.20
          WHEN 'SGD' THEN 5.20
          ELSE 1.0
        END) as revenue_dkk
      FROM non_club_orders
    `;

    const [clubResult, nonClubResult] = await Promise.all([
      db.execute(clubQuery),
      db.execute(nonClubQuery),
    ]);

    const clubRow = (clubResult as unknown as Array<{
      order_count: string;
      customer_count: string;
      aov_dkk: string;
      revenue_dkk: string;
    }>)[0];

    const nonClubRow = (nonClubResult as unknown as Array<{
      order_count: string;
      customer_count: string;
      aov_dkk: string;
      revenue_dkk: string;
    }>)[0];

    const clubOrders = parseInt(clubRow?.order_count) || 0;
    const clubCustomers = parseInt(clubRow?.customer_count) || 0;
    const clubAov = parseFloat(clubRow?.aov_dkk) || 0;
    const clubRevenue = parseFloat(clubRow?.revenue_dkk) || 0;

    const nonClubOrders = parseInt(nonClubRow?.order_count) || 0;
    const nonClubCustomers = parseInt(nonClubRow?.customer_count) || 0;
    const nonClubAov = parseFloat(nonClubRow?.aov_dkk) || 0;
    const nonClubRevenue = parseFloat(nonClubRow?.revenue_dkk) || 0;

    const totalOrders = clubOrders + nonClubOrders;
    const totalCustomers = clubCustomers + nonClubCustomers;
    const totalRevenue = clubRevenue + nonClubRevenue;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      // Basic counts
      totalOrders,
      clubOrders,
      nonClubOrders,
      clubPercentage: totalOrders > 0 ? (clubOrders / totalOrders) * 100 : 0,

      // Revenue (DKK)
      totalRevenue,
      clubRevenue,
      nonClubRevenue,
      clubRevenuePercentage: totalRevenue > 0 ? (clubRevenue / totalRevenue) * 100 : 0,

      // AOV (DKK)
      avgOrderValue,
      clubAOV: clubAov,
      nonClubAOV: nonClubAov,
      aovDifference: clubAov - nonClubAov,
      aovDifferencePercent: nonClubAov > 0 ? ((clubAov / nonClubAov) - 1) * 100 : 0,

      // Customer counts
      totalCustomers,
      clubCustomers,
      clubCustomerPercentage: totalCustomers > 0
        ? (clubCustomers / totalCustomers) * 100
        : 0,
    };
  } catch (error) {
    console.error("Error in getKPIs:", error);
    throw error;
  }
}

// Orders over time with FX conversion
// Uses CONSERVATIVE approach: only orders from verified cashback customers placed AFTER join date
export async function getOrdersOverTime(filters: Filters = {}) {
  try {
    const query = sql`
      WITH customer_join_dates AS (
        SELECT
          customer_id,
          MIN(recorded_at) as join_date
        FROM customer_cashback
        GROUP BY customer_id
      ),
      conservative_club_order_numbers AS (
        SELECT o.order_number
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '${sql.raw(ANALYSIS_START)}'
          AND o.created_at < '${sql.raw(ANALYSIS_END)}'
          AND o.created_at >= cjd.join_date
      )
      SELECT
        TO_CHAR(o.created_at, 'YYYY-MM') as month,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE o.order_number IN (SELECT order_number FROM conservative_club_order_numbers)) as club_count,
        COUNT(*) FILTER (WHERE o.order_number NOT IN (SELECT order_number FROM conservative_club_order_numbers)) as non_club_count,
        SUM(o.total_amount_cents / 100.0 * CASE o.currency_code
          WHEN 'DKK' THEN 1.0 WHEN 'EUR' THEN 7.45 WHEN 'SEK' THEN 0.65
          WHEN 'NOK' THEN 0.65 WHEN 'GBP' THEN 8.80 WHEN 'USD' THEN 7.00
          WHEN 'PLN' THEN 1.75 WHEN 'CZK' THEN 0.31 WHEN 'CHF' THEN 7.80
          WHEN 'AUD' THEN 4.50 WHEN 'CAD' THEN 5.20 WHEN 'HUF' THEN 0.019
          WHEN 'RON' THEN 1.50 WHEN 'BGN' THEN 3.80 WHEN 'NZD' THEN 4.20
          WHEN 'SGD' THEN 5.20 ELSE 1.0
        END) as revenue_dkk
      FROM "order" o
      WHERE o.created_at >= '${sql.raw(ANALYSIS_START)}'
        AND o.created_at < '${sql.raw(ANALYSIS_END)}'
      GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
      ORDER BY month
    `;

    const result = await db.execute(query);
    const rows = result as unknown as Array<{
      month: string;
      total: string;
      club_count: string;
      non_club_count: string;
      revenue_dkk: string;
    }>;

    return rows.map((row) => ({
      month: row.month,
      total: parseInt(row.total) || 0,
      clubCount: parseInt(row.club_count) || 0,
      nonClubCount: parseInt(row.non_club_count) || 0,
      revenue: parseFloat(row.revenue_dkk) || 0,
    }));
  } catch (error) {
    console.error("Error in getOrdersOverTime:", error);
    throw error;
  }
}

// Club vs Non-Club comparison with FX conversion
// Uses CONSERVATIVE approach: only orders from verified cashback customers placed AFTER join date
export async function getClubComparison(filters: Filters = {}) {
  try {
    // Conservative Club orders with FX conversion
    const clubQuery = sql`
      ${sql.raw(CONSERVATIVE_CLUB_CTE)}
      SELECT
        COUNT(*) as order_count,
        COUNT(DISTINCT customer_id) as customer_count,
        AVG(total_amount_cents / 100.0 * CASE currency_code
          WHEN 'DKK' THEN 1.0 WHEN 'EUR' THEN 7.45 WHEN 'SEK' THEN 0.65
          WHEN 'NOK' THEN 0.65 WHEN 'GBP' THEN 8.80 WHEN 'USD' THEN 7.00
          WHEN 'PLN' THEN 1.75 WHEN 'CZK' THEN 0.31 WHEN 'CHF' THEN 7.80
          WHEN 'AUD' THEN 4.50 WHEN 'CAD' THEN 5.20 WHEN 'HUF' THEN 0.019
          WHEN 'RON' THEN 1.50 WHEN 'BGN' THEN 3.80 WHEN 'NZD' THEN 4.20
          WHEN 'SGD' THEN 5.20 ELSE 1.0
        END) as aov_dkk,
        SUM(total_amount_cents / 100.0 * CASE currency_code
          WHEN 'DKK' THEN 1.0 WHEN 'EUR' THEN 7.45 WHEN 'SEK' THEN 0.65
          WHEN 'NOK' THEN 0.65 WHEN 'GBP' THEN 8.80 WHEN 'USD' THEN 7.00
          WHEN 'PLN' THEN 1.75 WHEN 'CZK' THEN 0.31 WHEN 'CHF' THEN 7.80
          WHEN 'AUD' THEN 4.50 WHEN 'CAD' THEN 5.20 WHEN 'HUF' THEN 0.019
          WHEN 'RON' THEN 1.50 WHEN 'BGN' THEN 3.80 WHEN 'NZD' THEN 4.20
          WHEN 'SGD' THEN 5.20 ELSE 1.0
        END) as revenue_dkk
      FROM conservative_club_orders
    `;

    // Non-Club orders
    const nonClubQuery = sql`
      ${sql.raw(NON_CLUB_CTE)}
      SELECT
        COUNT(*) as order_count,
        COUNT(DISTINCT customer_id) as customer_count,
        AVG(total_amount_cents / 100.0 * CASE currency_code
          WHEN 'DKK' THEN 1.0 WHEN 'EUR' THEN 7.45 WHEN 'SEK' THEN 0.65
          WHEN 'NOK' THEN 0.65 WHEN 'GBP' THEN 8.80 WHEN 'USD' THEN 7.00
          WHEN 'PLN' THEN 1.75 WHEN 'CZK' THEN 0.31 WHEN 'CHF' THEN 7.80
          WHEN 'AUD' THEN 4.50 WHEN 'CAD' THEN 5.20 WHEN 'HUF' THEN 0.019
          WHEN 'RON' THEN 1.50 WHEN 'BGN' THEN 3.80 WHEN 'NZD' THEN 4.20
          WHEN 'SGD' THEN 5.20 ELSE 1.0
        END) as aov_dkk,
        SUM(total_amount_cents / 100.0 * CASE currency_code
          WHEN 'DKK' THEN 1.0 WHEN 'EUR' THEN 7.45 WHEN 'SEK' THEN 0.65
          WHEN 'NOK' THEN 0.65 WHEN 'GBP' THEN 8.80 WHEN 'USD' THEN 7.00
          WHEN 'PLN' THEN 1.75 WHEN 'CZK' THEN 0.31 WHEN 'CHF' THEN 7.80
          WHEN 'AUD' THEN 4.50 WHEN 'CAD' THEN 5.20 WHEN 'HUF' THEN 0.019
          WHEN 'RON' THEN 1.50 WHEN 'BGN' THEN 3.80 WHEN 'NZD' THEN 4.20
          WHEN 'SGD' THEN 5.20 ELSE 1.0
        END) as revenue_dkk
      FROM non_club_orders
    `;

    const [clubResult, nonClubResult] = await Promise.all([
      db.execute(clubQuery),
      db.execute(nonClubQuery),
    ]);

    const clubRow = (clubResult as unknown as Array<{
      order_count: string;
      customer_count: string;
      aov_dkk: string;
      revenue_dkk: string;
    }>)[0];

    const nonClubRow = (nonClubResult as unknown as Array<{
      order_count: string;
      customer_count: string;
      aov_dkk: string;
      revenue_dkk: string;
    }>)[0];

    return {
      club: {
        orders: parseInt(clubRow?.order_count) || 0,
        customers: parseInt(clubRow?.customer_count) || 0,
        avgOrderValue: parseFloat(clubRow?.aov_dkk) || 0,
        totalRevenue: parseFloat(clubRow?.revenue_dkk) || 0,
      },
      nonClub: {
        orders: parseInt(nonClubRow?.order_count) || 0,
        customers: parseInt(nonClubRow?.customer_count) || 0,
        avgOrderValue: parseFloat(nonClubRow?.aov_dkk) || 0,
        totalRevenue: parseFloat(nonClubRow?.revenue_dkk) || 0,
      },
    };
  } catch (error) {
    console.error("Error in getClubComparison:", error);
    throw error;
  }
}

// Purchase frequency analysis
// Uses CONSERVATIVE approach: only orders from verified cashback customers placed AFTER join date
export async function getPurchaseFrequencyAnalysis() {
  try {
    // Get customer-level stats for conservative club customers
    const clubQuery = sql`
      ${sql.raw(CONSERVATIVE_CLUB_CTE)}
      SELECT
        customer_id,
        COUNT(*) as order_count
      FROM conservative_club_orders
      GROUP BY customer_id
    `;

    // Get customer-level stats for non-club orders
    const nonClubQuery = sql`
      ${sql.raw(NON_CLUB_CTE)}
      SELECT
        customer_id,
        COUNT(*) as order_count
      FROM non_club_orders
      WHERE customer_id IS NOT NULL
      GROUP BY customer_id
    `;

    const [clubResult, nonClubResult] = await Promise.all([
      db.execute(clubQuery),
      db.execute(nonClubQuery),
    ]);

    const clubCustomers = (clubResult as unknown as Array<{
      customer_id: string;
      order_count: string;
    }>).map(row => ({
      customerId: row.customer_id,
      orderCount: parseInt(row.order_count),
    }));

    const nonClubCustomers = (nonClubResult as unknown as Array<{
      customer_id: string;
      order_count: string;
    }>).map(row => ({
      customerId: row.customer_id,
      orderCount: parseInt(row.order_count),
    }));

    // Calculate stats for Club
    const clubStats = calculateFrequencyStats(clubCustomers);
    const nonClubStats = calculateFrequencyStats(nonClubCustomers);

    return [
      { group: "Club Members", ...clubStats },
      { group: "Non-Members", ...nonClubStats },
    ];
  } catch (error) {
    console.error("Error in getPurchaseFrequencyAnalysis:", error);
    throw error;
  }
}

function calculateFrequencyStats(customers: { customerId: string | null; orderCount: number }[]) {
  const count = customers.length;
  if (count === 0) {
    return {
      customerCount: 0,
      avgOrders: 0,
      medianOrders: 0,
      repeatRate: 0,
      loyalRate: 0,
    };
  }

  const orderCounts = customers.map((c) => c.orderCount).sort((a, b) => a - b);
  const avgOrders = orderCounts.reduce((a, b) => a + b, 0) / count;
  const medianOrders = orderCounts[Math.floor(count / 2)];
  const repeatRate = (orderCounts.filter((c) => c >= 2).length / count) * 100;
  const loyalRate = (orderCounts.filter((c) => c >= 3).length / count) * 100;

  return {
    customerCount: count,
    avgOrders,
    medianOrders,
    repeatRate,
    loyalRate,
  };
}

// Profit analysis with Club comparison
// Uses CONSERVATIVE approach: only orders from verified cashback customers placed AFTER join date
export async function getProfitAnalysis(filters: DateFilter = {}) {
  try {
    const query = sql`
      WITH customer_join_dates AS (
        SELECT
          customer_id,
          MIN(recorded_at) as join_date
        FROM customer_cashback
        GROUP BY customer_id
      ),
      conservative_club_order_numbers AS (
        SELECT o.order_number
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '${sql.raw(ANALYSIS_START)}'
          AND o.created_at < '${sql.raw(ANALYSIS_END)}'
          AND o.created_at >= cjd.join_date
      )
      SELECT
        TO_CHAR(o.created_at, 'YYYY-MM') as month,
        SUM(op.revenue_dkk) as revenue,
        SUM(op.total_profit_dkk) as profit,
        SUM(op.product_cost_dkk) as product_cost,
        SUM(op.freight_cost_dkk) as freight_cost,
        SUM(op.payment_cost_dkk) as payment_cost,
        SUM(CASE WHEN o.order_number IN (SELECT order_number FROM conservative_club_order_numbers) THEN op.total_profit_dkk ELSE 0 END) as club_profit,
        SUM(CASE WHEN o.order_number NOT IN (SELECT order_number FROM conservative_club_order_numbers) THEN op.total_profit_dkk ELSE 0 END) as non_club_profit,
        AVG(CASE WHEN o.order_number IN (SELECT order_number FROM conservative_club_order_numbers) THEN op.total_profit_dkk END) as club_avg_profit,
        AVG(CASE WHEN o.order_number NOT IN (SELECT order_number FROM conservative_club_order_numbers) THEN op.total_profit_dkk END) as non_club_avg_profit,
        COUNT(*) FILTER (WHERE o.order_number IN (SELECT order_number FROM conservative_club_order_numbers)) as club_orders,
        COUNT(*) FILTER (WHERE o.order_number NOT IN (SELECT order_number FROM conservative_club_order_numbers)) as non_club_orders
      FROM order_profit op
      INNER JOIN "order" o ON op.order_number = o.order_number
      WHERE o.created_at >= '${sql.raw(ANALYSIS_START)}'
        AND o.created_at < '${sql.raw(ANALYSIS_END)}'
      GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
      ORDER BY month
    `;

    const result = await db.execute(query);
    const rows = result as unknown as Array<{
      month: string;
      revenue: string;
      profit: string;
      product_cost: string;
      freight_cost: string;
      payment_cost: string;
      club_profit: string;
      non_club_profit: string;
      club_avg_profit: string;
      non_club_avg_profit: string;
      club_orders: string;
      non_club_orders: string;
    }>;

    return rows.map((row) => ({
      month: row.month,
      revenue: parseFloat(row.revenue) || 0,
      profit: parseFloat(row.profit) || 0,
      productCost: parseFloat(row.product_cost) || 0,
      freightCost: parseFloat(row.freight_cost) || 0,
      paymentCost: parseFloat(row.payment_cost) || 0,
      clubProfit: parseFloat(row.club_profit) || 0,
      nonClubProfit: parseFloat(row.non_club_profit) || 0,
      clubAvgProfit: parseFloat(row.club_avg_profit) || 0,
      nonClubAvgProfit: parseFloat(row.non_club_avg_profit) || 0,
      clubOrders: parseInt(row.club_orders) || 0,
      nonClubOrders: parseInt(row.non_club_orders) || 0,
      profitMargin: parseFloat(row.revenue) > 0
        ? (parseFloat(row.profit) / parseFloat(row.revenue)) * 100
        : 0,
    }));
  } catch (error) {
    console.error("Error in getProfitAnalysis:", error);
    throw error;
  }
}

// Cashback analysis
export async function getCashbackAnalysis() {
  // Get total cashback stats
  const stats = await db
    .select({
      totalRecords: count(),
      positiveRecords: sql<number>`COUNT(*) FILTER (WHERE ${customerCashback.balanceCents} > 0)`,
      totalCashbackDkk: sql<number>`SUM(CASE WHEN ${customerCashback.balanceCents} > 0 THEN ${customerCashback.balanceCents} / 100.0 ELSE 0 END)`,
      totalCustomers: sql<number>`COUNT(DISTINCT ${customerCashback.customerId})`,
      customersWithBalance: sql<number>`COUNT(DISTINCT ${customerCashback.customerId}) FILTER (WHERE ${customerCashback.balanceCents} > 0)`,
      avgCashbackDkk: sql<number>`AVG(CASE WHEN ${customerCashback.balanceCents} > 0 THEN ${customerCashback.balanceCents} / 100.0 END)`,
    })
    .from(customerCashback);

  // Get cashback by month
  const monthlyStats = await db
    .select({
      month: sql<string>`TO_CHAR(${customerCashback.recordedAt}, 'YYYY-MM')`,
      records: count(),
      cashbackDkk: sql<number>`SUM(CASE WHEN ${customerCashback.balanceCents} > 0 THEN ${customerCashback.balanceCents} / 100.0 ELSE 0 END)`,
    })
    .from(customerCashback)
    .groupBy(sql`TO_CHAR(${customerCashback.recordedAt}, 'YYYY-MM')`)
    .orderBy(asc(sql`TO_CHAR(${customerCashback.recordedAt}, 'YYYY-MM')`));

  const statsData = stats[0];

  return {
    totalRecords: statsData?.totalRecords || 0,
    positiveRecords: Number(statsData?.positiveRecords) || 0,
    positivePercentage: statsData?.totalRecords
      ? (Number(statsData.positiveRecords) / statsData.totalRecords) * 100
      : 0,
    totalCashbackDkk: Number(statsData?.totalCashbackDkk) || 0,
    totalCustomers: Number(statsData?.totalCustomers) || 0,
    customersWithBalance: Number(statsData?.customersWithBalance) || 0,
    avgCashbackDkk: Number(statsData?.avgCashbackDkk) || 0,
    engagementRate: statsData?.totalCustomers
      ? (Number(statsData.customersWithBalance) / Number(statsData.totalCustomers)) * 100
      : 0,
    monthly: monthlyStats.map((row) => ({
      month: row.month,
      records: row.records,
      cashbackDkk: Number(row.cashbackDkk) || 0,
    })),
  };
}

// AOV by currency over time
export async function getAOVByCurrency(filters: DateFilter = {}) {
  const conditions = buildOrderConditions(filters);

  const result = await db
    .select({
      month: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
      currency: orders.currencyCode,
      orderCount: count(),
      avgOrderValue: sql<number>`AVG(${orders.totalAmountCents} / 100.0)`,
      clubAOV: sql<number>`AVG(${orders.totalAmountCents} / 100.0) FILTER (WHERE ${orders.customerGroupKey} = 'club')`,
      nonClubAOV: sql<number>`AVG(${orders.totalAmountCents} / 100.0) FILTER (WHERE ${orders.customerGroupKey} IS NULL OR ${orders.customerGroupKey} != 'club')`,
    })
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`, orders.currencyCode)
    .orderBy(
      asc(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`),
      asc(orders.currencyCode)
    );

  return result.map((row) => ({
    month: row.month,
    currency: row.currency,
    orderCount: row.orderCount,
    avgOrderValue: Number(row.avgOrderValue) || 0,
    clubAOV: Number(row.clubAOV) || 0,
    nonClubAOV: Number(row.nonClubAOV) || 0,
  }));
}

// Returning order rate analysis
// Uses CONSERVATIVE approach: only orders from verified cashback customers placed AFTER join date
export async function getReturningOrderAnalysis() {
  try {
    const query = sql`
      WITH customer_join_dates AS (
        SELECT
          customer_id,
          MIN(recorded_at) as join_date
        FROM customer_cashback
        GROUP BY customer_id
      ),
      conservative_club_order_numbers AS (
        SELECT o.order_number
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '${sql.raw(ANALYSIS_START)}'
          AND o.created_at < '${sql.raw(ANALYSIS_END)}'
          AND o.created_at >= cjd.join_date
      )
      SELECT
        TO_CHAR(o.created_at, 'YYYY-MM') as month,
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE o.order_number IN (SELECT order_number FROM conservative_club_order_numbers)) as club_orders,
        COUNT(*) FILTER (WHERE o.order_number NOT IN (SELECT order_number FROM conservative_club_order_numbers)) as non_club_orders
      FROM "order" o
      WHERE o.created_at >= '${sql.raw(ANALYSIS_START)}'
        AND o.created_at < '${sql.raw(ANALYSIS_END)}'
      GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
      ORDER BY month
    `;

    const result = await db.execute(query);
    const rows = result as unknown as Array<{
      month: string;
      total_orders: string;
      club_orders: string;
      non_club_orders: string;
    }>;

    return rows.map((row) => ({
      month: row.month,
      totalOrders: parseInt(row.total_orders) || 0,
      clubOrders: parseInt(row.club_orders) || 0,
      nonClubOrders: parseInt(row.non_club_orders) || 0,
      // Returning rate calculation would need customer-level tracking
      returningRate: 0, // Placeholder - needs more complex query
      clubReturningRate: 0,
      nonClubReturningRate: 0,
    }));
  } catch (error) {
    console.error("Error in getReturningOrderAnalysis:", error);
    throw error;
  }
}

// ROI calculation
// Uses CONSERVATIVE approach: only orders from verified cashback customers placed AFTER join date
export async function getProgramROI() {
  try {
    // Get profit comparison using conservative club definition
    const profitQuery = sql`
      WITH customer_join_dates AS (
        SELECT
          customer_id,
          MIN(recorded_at) as join_date
        FROM customer_cashback
        GROUP BY customer_id
      ),
      conservative_club_order_numbers AS (
        SELECT o.order_number
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '${sql.raw(ANALYSIS_START)}'
          AND o.created_at < '${sql.raw(ANALYSIS_END)}'
          AND o.created_at >= cjd.join_date
      )
      SELECT
        SUM(CASE WHEN o.order_number IN (SELECT order_number FROM conservative_club_order_numbers) THEN op.total_profit_dkk ELSE 0 END) as club_total_profit,
        SUM(CASE WHEN o.order_number NOT IN (SELECT order_number FROM conservative_club_order_numbers) THEN op.total_profit_dkk ELSE 0 END) as non_club_total_profit,
        AVG(CASE WHEN o.order_number IN (SELECT order_number FROM conservative_club_order_numbers) THEN op.total_profit_dkk END) as club_avg_profit,
        AVG(CASE WHEN o.order_number NOT IN (SELECT order_number FROM conservative_club_order_numbers) THEN op.total_profit_dkk END) as non_club_avg_profit,
        COUNT(*) FILTER (WHERE o.order_number IN (SELECT order_number FROM conservative_club_order_numbers)) as club_orders,
        COUNT(*) FILTER (WHERE o.order_number NOT IN (SELECT order_number FROM conservative_club_order_numbers)) as non_club_orders
      FROM order_profit op
      INNER JOIN "order" o ON op.order_number = o.order_number
      WHERE o.created_at >= '${sql.raw(ANALYSIS_START)}'
        AND o.created_at < '${sql.raw(ANALYSIS_END)}'
    `;

    // Get cashback redeemed (within analysis period)
    // Note: We use balance_cents > 0 to count records with cashback
    const cashbackQuery = sql`
      SELECT
        COUNT(*) FILTER (WHERE balance_cents > 0) as cashback_orders,
        SUM(CASE WHEN balance_cents > 0 THEN balance_cents / 100.0 ELSE 0 END) as total_cashback_dkk
      FROM customer_cashback
      WHERE recorded_at >= '${sql.raw(ANALYSIS_START)}'
        AND recorded_at < '${sql.raw(ANALYSIS_END)}'
    `;

    const [profitResult, cashbackResult] = await Promise.all([
      db.execute(profitQuery),
      db.execute(cashbackQuery),
    ]);

    const profitRow = (profitResult as unknown as Array<{
      club_total_profit: string;
      non_club_total_profit: string;
      club_avg_profit: string;
      non_club_avg_profit: string;
      club_orders: string;
      non_club_orders: string;
    }>)[0];

    const cashbackRow = (cashbackResult as unknown as Array<{
      cashback_orders: string;
      total_cashback_dkk: string;
    }>)[0];

    const clubAvgProfit = parseFloat(profitRow?.club_avg_profit) || 0;
    const nonClubAvgProfit = parseFloat(profitRow?.non_club_avg_profit) || 0;
    const profitDiff = clubAvgProfit - nonClubAvgProfit;
    const clubOrders = parseInt(profitRow?.club_orders) || 0;
    const totalCashback = parseFloat(cashbackRow?.total_cashback_dkk) || 0;

    // Incremental profit from Club orders
    const incrementalProfit = profitDiff * clubOrders;

    // Shipping subsidy calculation (using PDF values for more accuracy)
    // PDF: 27,959 subsidized shipping orders, 838,770 DKK total
    // We estimate based on proportion of club orders
    const AVG_SHIPPING_SUBSIDY = 30; // From PDF: 838,770 / 27,959 ≈ 30 DKK
    const SUBSIDY_RATE = 0.37; // From PDF: 27,959 / 75,272 ≈ 37%
    const estimatedSubsidizedOrders = Math.round(clubOrders * SUBSIDY_RATE);
    const shippingSubsidy = estimatedSubsidizedOrders * AVG_SHIPPING_SUBSIDY;

    // Total program costs
    const totalProgramCosts = totalCashback + shippingSubsidy;

    // Net value and ROI
    const netValue = incrementalProfit - totalProgramCosts;
    const roi = totalProgramCosts > 0 ? (netValue / totalProgramCosts) * 100 : 0;

    return {
      clubTotalProfit: parseFloat(profitRow?.club_total_profit) || 0,
      nonClubTotalProfit: parseFloat(profitRow?.non_club_total_profit) || 0,
      clubAvgProfit,
      nonClubAvgProfit,
      profitDifference: profitDiff,
      profitDifferencePercent: nonClubAvgProfit > 0 ? ((clubAvgProfit / nonClubAvgProfit) - 1) * 100 : 0,
      clubOrders,
      incrementalProfit,
      totalCashbackCost: totalCashback,
      shippingSubsidy,
      totalProgramCosts,
      netValue,
      roi,
      isProfitable: netValue > 0,
    };
  } catch (error) {
    console.error("Error in getProgramROI:", error);
    throw error;
  }
}

// Available filter options
export async function getFilterOptions() {
  const countries = await db
    .selectDistinct({ countryCode: orders.countryCode })
    .from(orders)
    .where(sql`${orders.countryCode} IS NOT NULL`)
    .orderBy(asc(orders.countryCode));

  const currencies = await db
    .selectDistinct({ currencyCode: orders.currencyCode })
    .from(orders)
    .orderBy(asc(orders.currencyCode));

  const months = await db
    .selectDistinct({
      month: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
    })
    .from(orders)
    .orderBy(asc(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`));

  return {
    countries: countries.map((c) => c.countryCode).filter(Boolean) as string[],
    currencies: currencies.map((c) => c.currencyCode),
    months: months.map((m) => m.month),
  };
}

// Segment distribution for customers
// Uses CONSERVATIVE approach: only orders from verified cashback customers placed AFTER join date
export async function getSegmentDistribution() {
  try {
    // Get customer-level order counts for conservative club customers
    const clubQuery = sql`
      ${sql.raw(CONSERVATIVE_CLUB_CTE)}
      SELECT
        customer_id,
        COUNT(*) as order_count
      FROM conservative_club_orders
      GROUP BY customer_id
    `;

    // Get customer-level order counts for non-club orders
    const nonClubQuery = sql`
      ${sql.raw(NON_CLUB_CTE)}
      SELECT
        customer_id,
        COUNT(*) as order_count
      FROM non_club_orders
      WHERE customer_id IS NOT NULL
      GROUP BY customer_id
    `;

    const [clubResult, nonClubResult] = await Promise.all([
      db.execute(clubQuery),
      db.execute(nonClubQuery),
    ]);

    const clubSegments = (clubResult as unknown as Array<{
      customer_id: string;
      order_count: string;
    }>).map(row => ({
      orderCount: parseInt(row.order_count),
    }));

    const nonClubSegments = (nonClubResult as unknown as Array<{
      customer_id: string;
      order_count: string;
    }>).map(row => ({
      orderCount: parseInt(row.order_count),
    }));

    const getSegmentCounts = (customers: { orderCount: number }[]) => {
      const loyal = customers.filter((c) => c.orderCount >= 3).length;
      const returning = customers.filter((c) => c.orderCount === 2).length;
      const newCustomers = customers.filter((c) => c.orderCount === 1).length;
      return { loyal, returning, new: newCustomers };
    };

    const clubCounts = getSegmentCounts(clubSegments);
    const nonClubCounts = getSegmentCounts(nonClubSegments);

    return [
      { group: "Club", segment: "loyal", count: clubCounts.loyal },
      { group: "Club", segment: "returning", count: clubCounts.returning },
      { group: "Club", segment: "new", count: clubCounts.new },
      { group: "Non-Club", segment: "loyal", count: nonClubCounts.loyal },
      { group: "Non-Club", segment: "returning", count: nonClubCounts.returning },
      { group: "Non-Club", segment: "new", count: nonClubCounts.new },
    ];
  } catch (error) {
    console.error("Error in getSegmentDistribution:", error);
    throw error;
  }
}

// Monthly Club Metrics Breakdown - CONSERVATIVE APPROACH
// Only counts orders from verified cashback customers placed AFTER their join date
// This is done entirely in SQL for performance
export async function getMonthlyClubMetrics() {
  try {
    // Use a CTE to get customer join dates and filter orders in SQL
    // This is much more efficient than fetching all data to JS
    // Analysis period: April 1, 2025 - January 31, 2026
    // FX conversion applied for proper DKK AOV calculation
    const conservativeOrdersQuery = sql`
      WITH customer_join_dates AS (
        SELECT
          customer_id,
          MIN(recorded_at) as join_date
        FROM customer_cashback
        GROUP BY customer_id
      ),
      conservative_orders AS (
        SELECT
          o.order_number,
          o.customer_id,
          o.created_at,
          o.total_amount_cents,
          o.currency_code,
          o.country_code,
          TO_CHAR(o.created_at, 'YYYY-MM') as month,
          o.total_amount_cents / 100.0 * CASE o.currency_code
            WHEN 'DKK' THEN 1.0
            WHEN 'EUR' THEN 7.45
            WHEN 'SEK' THEN 0.65
            WHEN 'NOK' THEN 0.65
            WHEN 'GBP' THEN 8.80
            WHEN 'USD' THEN 7.00
            WHEN 'PLN' THEN 1.75
            WHEN 'CZK' THEN 0.31
            WHEN 'CHF' THEN 7.80
            WHEN 'AUD' THEN 4.50
            WHEN 'CAD' THEN 5.20
            WHEN 'HUF' THEN 0.019
            WHEN 'RON' THEN 1.50
            WHEN 'BGN' THEN 3.80
            WHEN 'NZD' THEN 4.20
            WHEN 'SGD' THEN 5.20
            ELSE 1.0
          END as amount_dkk
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '2025-04-01'
          AND o.created_at < '2026-02-01'
          AND o.created_at >= cjd.join_date
      )
      SELECT
        month,
        COUNT(*) as club_orders,
        AVG(amount_dkk) as aov_all
      FROM conservative_orders
      GROUP BY month
      ORDER BY month
    `;

    const ordersResult = await db.execute(conservativeOrdersQuery);

    // Get cashback data by month (within analysis period)
    // NOTE: This shows cashback BALANCE, not redeemed amount
    const cashbackQuery = sql`
      SELECT
        TO_CHAR(recorded_at, 'YYYY-MM') as month,
        COUNT(*) FILTER (WHERE balance_cents > 0) as cb_orders,
        SUM(CASE WHEN balance_cents > 0 THEN balance_cents / 100.0 ELSE 0 END) as total_cb
      FROM customer_cashback
      WHERE recorded_at >= '2025-04-01'
        AND recorded_at < '2026-02-01'
      GROUP BY TO_CHAR(recorded_at, 'YYYY-MM')
      ORDER BY month
    `;

    const cashbackResult = await db.execute(cashbackQuery);

    // Get profit data by month for conservative orders (within analysis period)
    const profitQuery = sql`
      WITH customer_join_dates AS (
        SELECT
          customer_id,
          MIN(recorded_at) as join_date
        FROM customer_cashback
        GROUP BY customer_id
      ),
      conservative_orders AS (
        SELECT
          o.order_number,
          TO_CHAR(o.created_at, 'YYYY-MM') as month
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '2025-04-01'
          AND o.created_at < '2026-02-01'
          AND o.created_at >= cjd.join_date
      )
      SELECT
        co.month,
        AVG(op.total_profit_dkk) as profit_all
      FROM conservative_orders co
      INNER JOIN order_profit op ON co.order_number = op.order_number
      GROUP BY co.month
      ORDER BY co.month
    `;

    const profitResult = await db.execute(profitQuery);

    // Get shipping status breakdown by month
    const shippingQuery = sql`
      WITH customer_join_dates AS (
        SELECT
          customer_id,
          MIN(recorded_at) as join_date
        FROM customer_cashback
        GROUP BY customer_id
      ),
      conservative_orders AS (
        SELECT
          o.order_number,
          o.country_code,
          o.total_amount_cents,
          o.currency_code,
          TO_CHAR(o.created_at, 'YYYY-MM') as month,
          o.total_amount_cents / 100.0 * CASE o.currency_code
            WHEN 'DKK' THEN 1.0
            WHEN 'EUR' THEN 7.45
            WHEN 'SEK' THEN 0.65
            WHEN 'NOK' THEN 0.65
            WHEN 'GBP' THEN 8.80
            WHEN 'USD' THEN 7.00
            WHEN 'PLN' THEN 1.75
            WHEN 'CZK' THEN 0.31
            WHEN 'CHF' THEN 7.80
            WHEN 'AUD' THEN 4.50
            WHEN 'CAD' THEN 5.20
            WHEN 'HUF' THEN 0.019
            WHEN 'RON' THEN 1.50
            WHEN 'BGN' THEN 3.80
            WHEN 'NZD' THEN 4.20
            WHEN 'SGD' THEN 5.20
            ELSE 1.0
          END as amount_dkk
        FROM "order" o
        INNER JOIN customer_join_dates cjd ON o.customer_id = cjd.customer_id
        WHERE o.customer_group_key = 'club'
          AND o.created_at >= '2025-04-01'
          AND o.created_at < '2026-02-01'
          AND o.created_at >= cjd.join_date
      )
      SELECT
        month,
        COUNT(*) FILTER (WHERE amount_dkk < 249) as sh_paid,
        COUNT(*) FILTER (WHERE amount_dkk >= 249) as sh_free
      FROM conservative_orders
      GROUP BY month
      ORDER BY month
    `;

    const shippingResult = await db.execute(shippingQuery);

    // Create lookup maps
    const cashbackMap = new Map<string, { cbOrders: number; totalCB: number }>();
    const cashbackRows = cashbackResult as unknown as Array<{ month: string; cb_orders: string; total_cb: string }>;
    cashbackRows.forEach(row => {
      cashbackMap.set(row.month, {
        cbOrders: parseInt(row.cb_orders) || 0,
        totalCB: parseFloat(row.total_cb) || 0,
      });
    });

    const profitMap = new Map<string, number>();
    const profitRows = profitResult as unknown as Array<{ month: string; profit_all: string }>;
    profitRows.forEach(row => {
      profitMap.set(row.month, parseFloat(row.profit_all) || 0);
    });

    const shippingMap = new Map<string, { shPaid: number; shFree: number }>();
    const shippingRows = shippingResult as unknown as Array<{ month: string; sh_paid: string; sh_free: string }>;
    shippingRows.forEach(row => {
      shippingMap.set(row.month, {
        shPaid: parseInt(row.sh_paid) || 0,
        shFree: parseInt(row.sh_free) || 0,
      });
    });

    // Build monthly data
    const ordersRows = ordersResult as unknown as Array<{ month: string; club_orders: string; aov_all: string }>;
    const monthlyData = ordersRows.map(row => {
      const month = row.month;
      const clubOrders = parseInt(row.club_orders) || 0;
      const aovAll = Math.round(parseFloat(row.aov_all) || 0);
      const cbData = cashbackMap.get(month);
      const cbOrders = cbData?.cbOrders || 0;
      const totalCB = Math.round(cbData?.totalCB || 0);
      const profitAll = Math.round(profitMap.get(month) || 0);
      const shippingData = shippingMap.get(month);

      return {
        month,
        clubOrders,
        cbOrders,
        totalCB,
        avgCB: cbOrders > 0 ? Math.round(totalCB / cbOrders) : 0,
        aovAll,
        aovCB: 0, // Would need additional query to calculate
        aovNoCB: 0,
        profitAll,
        profitCB: 0,
        shPaid: shippingData?.shPaid || 0,
        shPaidCB: 0,
        shFree: shippingData?.shFree || 0,
      };
    });

    // Calculate totals
    const totals = {
      month: "TOTAL",
      clubOrders: monthlyData.reduce((sum, m) => sum + m.clubOrders, 0),
      cbOrders: monthlyData.reduce((sum, m) => sum + m.cbOrders, 0),
      totalCB: monthlyData.reduce((sum, m) => sum + m.totalCB, 0),
      avgCB: 0,
      aovAll: 0,
      aovCB: 0,
      aovNoCB: 0,
      profitAll: 0,
      profitCB: 0,
      shPaid: monthlyData.reduce((sum, m) => sum + m.shPaid, 0),
      shPaidCB: 0,
      shFree: monthlyData.reduce((sum, m) => sum + m.shFree, 0),
    };

    // Calculate weighted averages
    totals.avgCB = totals.cbOrders > 0 ? Math.round(totals.totalCB / totals.cbOrders) : 0;

    let totalAovWeight = 0;
    let totalProfitWeight = 0;
    monthlyData.forEach(m => {
      totalAovWeight += m.aovAll * m.clubOrders;
      totalProfitWeight += m.profitAll * m.clubOrders;
    });

    totals.aovAll = totals.clubOrders > 0 ? Math.round(totalAovWeight / totals.clubOrders) : 0;
    totals.profitAll = totals.clubOrders > 0 ? Math.round(totalProfitWeight / totals.clubOrders) : 0;

    return {
      monthly: monthlyData,
      totals,
    };
  } catch (error) {
    console.error("Error in getMonthlyClubMetrics:", error);
    throw error;
  }
}

// Helper functions
function buildOrderConditions(filters: Filters) {
  const conditions = [];

  if (filters.startDate) {
    conditions.push(gte(orders.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(orders.createdAt, filters.endDate));
  }
  if (filters.countryCode) {
    conditions.push(eq(orders.countryCode, filters.countryCode));
  }
  if (filters.currencyCode) {
    conditions.push(eq(orders.currencyCode, filters.currencyCode));
  }

  return conditions;
}
