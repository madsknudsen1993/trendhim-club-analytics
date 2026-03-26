import {
  timestamp,
  pgTable,
  text,
  integer,
  boolean,
  real,
  index,
} from "drizzle-orm/pg-core";

// ============================================
// Trendhim Club Analytics Tables
// ============================================

export const orders = pgTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderNumber: text("order_number").unique().notNull(),
    customerId: text("customer_id"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    totalAmountCents: integer("total_amount_cents").notNull(),
    currencyCode: text("currency_code").notNull(),
    customerGroupKey: text("customer_group_key"), // 'club' or null
    locale: text("locale"),
    countryCode: text("country_code"),
    orderState: text("order_state"),
    totalItems: integer("total_items"),
  },
  (table) => [
    index("orders_customer_idx").on(table.customerId),
    index("orders_created_at_idx").on(table.createdAt),
  ]
);

export const orderProfits = pgTable("order_profit", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderNumber: text("order_number").notNull(),
  revenueDkk: real("revenue_dkk"),
  totalProfitDkk: real("total_profit_dkk"),
  productCostDkk: real("product_cost_dkk"),
  freightCostDkk: real("freight_cost_dkk"),
  paymentCostDkk: real("payment_cost_dkk"),
});

export const customerCashback = pgTable("customer_cashback", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  customerId: text("customer_id").notNull(),
  orderNumber: text("order_number"),
  balanceCents: integer("balance_cents"),
  currencyCode: text("currency_code"),
  recordedAt: timestamp("recorded_at", { mode: "date" }).defaultNow(),
});

export const customerSnapshots = pgTable(
  "customer_snapshot",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    customerId: text("customer_id").notNull(),
    snapshotMonth: text("snapshot_month").notNull(), // "2025-01"
    segment: text("segment").notNull(), // 'loyal', 'returning', 'new', 'inactive'
    isClubMember: boolean("is_club_member").default(false),
    orderCount12m: integer("order_count_12m"),
    totalSpentCents: integer("total_spent_cents"),
  },
  (table) => [index("snapshots_month_idx").on(table.snapshotMonth)]
);
