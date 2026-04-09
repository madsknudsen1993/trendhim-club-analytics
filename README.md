# Trendhim Club Analytics Dashboard

## Overview
Next.js dashboard analyzing the ROI and customer behavior impact of the Trendhim Club loyalty program.

**Analysis Period:** April 2025 - January 2026 (10 months)

## Quick Start
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Four Customer Segments Analyzed

### 1. Club Program ROI (Red) - Cross-sectional
- Compares ALL Club orders vs ALL Non-Club orders
- **Finding:** +5.7% frequency but -15 DKK profit/order (cashback)
- **Net Result:** -1.13M DKK (10 months)
- **Limitation:** Does NOT track same customers over time

### 2. Best Customers (Green) - Longitudinal
- 4,640 customers with 2+ orders BEFORE and AFTER joining
- **Finding:** +24.8% frequency, +14.1% monthly profit
- **Monthly Uplift:** +6.59 DKK/customer
- **Strength:** Proves causal behavior change

### 3. Medium Customers (Teal) - Longitudinal
- 9,604 customers with 1+ order before, 2+ after
- **Finding:** +116% frequency, 38% one-time buyers converted
- **Monthly Uplift:** +12.41 DKK/customer
- **Note:** Includes regression-to-mean effects

### 4. Fresh Customers (Blue) - Period Comparison
- ALL new customers (Club + Non-Club)
- **Finding:** 1st→2nd order rate -0.79pp change
- **Limitation:** May reflect market trends, not just Club

## Key Metrics Added
- Items/Order and Shipping/Order analysis
- Free Shipping % distribution (before/after Club)
- Monthly profit = Frequency × Profit/Order
- Structured recap (Finding/Limitation/Action) for each segment

## File Structure
```
src/app/_components/tabs/
├── executive-summary.tsx   # Main dashboard with 4 segments
├── data-source.tsx         # CORE_METRICS data constants
└── ...other tabs

scripts/
├── analyze_shipping_revenue.py  # Shipping & order behavior analysis
└── fresh_customer_analysis.py   # 1st→2nd order conversion
```

## Data Sources
- PowerBI Order History CSVs (not in repo - .gitignore)
- CORE_METRICS in data-source.tsx contains all analyzed values

## Recent Changes (April 9, 2026)
1. Simplified to monthly per-customer metrics (no annual extrapolation)
2. Added Items/Order, Shipping/Order, Free Shipping % to segments
3. Added structured recap format to all segments
4. Reordered metrics table for clarity

## Program Costs (Monthly)
- Cashback: ~360K DKK/mo (already in profit figures)
- Shipping Subsidy: ~81.5K DKK/mo (actual cost)
