# Trendhim Club Analytics Dashboard

## Overview
Next.js dashboard analyzing the ROI and customer behavior impact of the Trendhim Club loyalty program (15% cashback, lower free shipping thresholds).

**Analysis Period:** April 2025 - January 2026 (10 months)

**Tech Stack:** Next.js 16, React, TypeScript, Recharts, Tailwind CSS, shadcn/ui

## Quick Start
```bash
npm install
npm run dev
```
Open http://localhost:3000

### Export Dashboard to PDF
```bash
npm run dev &
node scripts/export-dashboard-pdfs.js
```
Exports all tabs as PDF and PNG to `exports/` folder.

---

## Key Conclusions (Board Presentation - April 2026)

### Overall Finding
**The Club programme has not delivered a positive business impact and will need to be phased out.**

### Cost Summary
| Cost Category | Amount | Notes |
|---------------|--------|-------|
| Profit Lost | **1.13M DKK** | -15 DKK/order × 75,272 Club orders |
| Cashback (15%) | 2.7M DKK | Already reflected in profit figures |
| Shipping Subsidy | ~619K DKK | Country-specific thresholds |

### Frequency Analysis
| Segment | Club Change | Control Change | TRUE Club Effect |
|---------|-------------|----------------|------------------|
| Best Customers | +62.2% | +63.3% | **-1.1pp** (No effect) |
| Medium Customers | +403.6% | +349.9% | **+53.7pp** (Small effect) |
| Fresh Customers | -0.85pp conversion | N/A | Negative impact |

### Honest Assessment
- **Frequency difference is modest:** +0.38 orders for cashback users vs non-Club (17%)
- **Median orders identical (2)** across all fresh customer segments
- **Club membership alone doesn't drive frequency** - Club (no CB) has 2.33 orders vs Non-Club's 2.25
- **Correlation ≠ Causation:** Can't prove cashback causes more orders

---

## Four Customer Segments Analyzed

### 1. Club Program ROI (Cross-sectional)
- **75,272 Club orders** vs 570,860 Non-Club orders
- AOV: Club 335 vs Non-Club 338 DKK (median)
- Profit/Order: Club 158 vs Non-Club 173 DKK (-15 DKK)
- **Net Result:** -1.13M DKK

### 2. Best Customers (Control-Validated)
- **Sample:** 4,564 Club members
- **TRUE Club Effect:** 0 DKK/mo (control group improved same amount)
- Frequency lift is natural loyal customer behavior, not Club-driven

### 3. Medium Customers (Control-Validated)
- **Sample:** 4,631 Club members
- **TRUE Club Effect:** +5.64 DKK/mo (~13% of observed lift)
- **Annual Value:** ~313K DKK/year
- Club helps, but effect smaller than originally thought

### 4. Fresh Customers (Period Comparison)
- **Sample:** 340,259 new customers
- **Conversion Rate:** 7.21% (down from 8.06% before Club)
- **Lost Conversions:** ~289/month
- **Monthly Cost:** ~57K DKK from lost conversions

---

## Fresh Customer Engagement Analysis

### Converters Breakdown (23,321 total)
| Segment | Count | Mean Orders | Avg Profit/Customer |
|---------|-------|-------------|---------------------|
| Used Cashback | 8,238 (35%) | 2.63 | 613.35 DKK |
| Club (no CB) | 1,143 (5%) | 2.33 | 555.13 DKK |
| Non-Club | 13,940 (60%) | 2.25 | 494.66 DKK |

### Key Insight
Club (no CB) has **2.33 orders** vs Non-Club's **2.25 orders** - essentially no difference.
This suggests Club membership alone doesn't increase purchase frequency.
The lift appears only when customers actively use cashback, but this may be selection bias.

---

## Shipping Subsidy Methodology

### Country-Specific Thresholds
Thresholds vary by country (in local currency):
- DK: Club 199, Normal 449 DKK
- SE: Club 249, Normal 449 SEK
- DE: Club 29, Normal 59 EUR
- GB: Club 19.90, Normal 39 GBP
- etc.

### Calculation
Orders in subsidy zone (between Club and Normal threshold) that get free shipping:
- ~20,634 orders with correct country-specific thresholds
- Estimated subsidy: ~619K DKK (@30 DKK avg)

---

## Data Quality Notes

### Exclusions
- **CE orders excluded:** System orders, not customer purchases
- **Internal/Resend/Exchange orders excluded:** Standard data cleaning

### Limitations
- **Control group sizes small:** Best (272), Medium (606)
- **Only 4.6%** of 201K Club members are in P&L analysis
- **56.9%** (114,585) placed ONE Club order and never returned

---

## File Structure
```
src/app/_components/tabs/
├── executive-summary.tsx   # Main dashboard
├── data-source.tsx         # CORE_METRICS constants
├── conclusion.tsx          # Board summary
└── ...other tabs

scripts/
├── segment_pnl_isolated.py           # Segment P&L analysis
├── fresh_customer_analysis.py        # Conversion analysis
├── fresh_engagement_matching_criteria.py  # Engagement by segment
├── shipping_subsidy_verify.py        # Country-specific shipping
├── shipping_country_test.py          # Shipping threshold testing
└── export-dashboard-pdfs.js          # PDF export utility
```

---

## Uncertainties Acknowledged

1. **Frequency Timeline:** Unclear how long a cashback programme needs to run before true impact measurable
2. **Cashback Reminders:** Only introduced in October - large share of reminders not yet sent
3. **Campaign Pressure:** Pre-Club had 3-5 campaigns monthly vs higher frequency now
4. **Lower Shipping Threshold CVR:** Unclear positive impact on conversion rate

---

## Next Steps (May-June 2026)

1. **External Validation:** Speak with brands who launched similar programmes
2. **Short-term Phase-out Plan:** Customer-friendly transition to minimize negative brand impact
3. **Long-term Loyalty Plan:** Sharper segmentation, focused email marketing, trend-driven assortment

---

## Last Updated
April 15, 2026
