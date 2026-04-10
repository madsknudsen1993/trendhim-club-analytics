# Trendhim Club Analytics Dashboard

## Overview
Next.js dashboard analyzing the ROI and customer behavior impact of the Trendhim Club loyalty program.

**Analysis Period:** April 2025 - March 2026 (~11 months)

## Quick Start
```bash
npm install
npm run dev
```
Open http://localhost:3000

---

## CRITICAL FINDING: Control Group Analysis

### The Big Question
"Is the frequency lift we see in Club members actually due to Club, or would it have happened anyway?"

### Methodology
We compared Club members vs **Non-Club customers meeting the SAME criteria** (control group):
- Same order history requirements (2+ orders, 60+ days span, etc.)
- Excluded CE orders (system orders, not customer purchases)

### Results

| Segment | Club Change | Control Change | TRUE Club Effect |
|---------|-------------|----------------|------------------|
| **Best Customers** | +62.2% | +63.3% | **-1.1pp** (NO effect!) |
| **Medium Customers** | +403.6% | +349.9% | **+53.7pp** (Club helps) |

### Revised Annual Impact

| Metric | Original Estimate | TRUE Club Effect | Difference |
|--------|-------------------|------------------|------------|
| Best Customers | 1.09M DKK/year | **0 DKK/year** | -100% |
| Medium Customers | 2.36M DKK/year | **313K DKK/year** | -87% |
| **TOTAL** | **3.4M DKK/year** | **313K DKK/year** | **-91%** |

### Key Insight
**91% of the originally claimed annual impact was natural customer behavior**, not Club-driven.
- Best Customers: Control group improved just as much → Club adds no incremental value
- Medium Customers: Club provides ~13% additional lift (313K DKK/year true value)

---

## Four Customer Segments Analyzed

### 1. Club Program ROI (Cross-sectional)
- Compares ALL Club orders vs ALL Non-Club orders
- **Finding:** +5.7% frequency but -15 DKK profit/order (cashback)
- **Net Result:** -1.13M DKK (10 months)
- **Limitation:** Does NOT track same customers over time

### 2. Best Customers (Segment-Isolated, Control-Validated)
- **Sample:** 4,564 Club members with 2+ orders BEFORE and AFTER
- **Observed Change:** +62.2% frequency, +19.91 DKK/mo profit lift
- **Control Group:** 272 non-Club customers with same criteria
- **Control Change:** +63.3% (same as Club!)
- **TRUE Club Effect:** +0.00 DKK/mo (no incremental value)
- **Conclusion:** Frequency lift is natural loyal customer behavior

### 3. Medium Customers (Segment-Isolated, Control-Validated)
- **Sample:** 4,631 Club members with 1+ before, 2+ orders after
- **Observed Change:** +403.6% frequency, +42.38 DKK/mo profit lift
- **Control Group:** 606 non-Club customers with same criteria
- **Control Change:** +349.9%
- **TRUE Club Effect:** +5.64 DKK/mo (~13% of observed lift)
- **Annual Value:** ~313K DKK/year
- **Conclusion:** Club does help, but effect is smaller than originally thought

### 4. Fresh Customers (Period Comparison)
- **Sample:** 340,259 new customers after Club launch
- **Conversion Rate:** 7.21% (down from 8.06% before Club)
- **Lost Conversions:** ~289/month × 197 DKK = ~57K DKK/month cost
- **Cashback Usage:** Only 12 of 24,533 converters used cashback (0.05%)
- **Total Monthly Cost:** ~57K DKK (99.85% from lost conversions, 0.15% from cashback)

---

## Club Member Breakdown (201,477 total)

| Category | Count | % | Description |
|----------|-------|---|-------------|
| Best Customers | 4,589 | 2.3% | 2+ orders in BOTH periods |
| Medium Customers | 4,664 | 2.3% | 1+ before, 2+ after |
| New Active | 12,000 | 6.0% | New, multiple orders |
| New Single-Order | 114,585 | 56.9% | New, only 1 order |
| Lapsed Returned | 36,232 | 18.0% | Had orders before, 1 after |
| Inactive/Short Span | 29,407 | 14.6% | Other |

---

## Data Quality Notes

### Exclusions
- **CE orders excluded:** These are system orders from another system, not customer purchases
- **Internal/Resend/Exchange orders excluded:** Standard data cleaning

### Limitations
- **Control group sizes are small:** Best (272), Medium (606) - limits statistical confidence
- **Date precision:** Order history has only DATE, not TIME - affects same-day order ranking
- **Selection bias:** We only measure customers active in both periods

---

## File Structure
```
src/app/_components/tabs/
├── executive-summary.tsx   # Main dashboard with control group analysis
├── ceo-qa.tsx              # CEO Q&A tab
├── data-source.tsx         # CORE_METRICS data constants
└── ...other tabs

scripts/
├── segment_pnl_isolated.py          # Segment-isolated P&L analysis
├── fresh_customer_analysis.py       # 1st→2nd order conversion
├── fresh_customer_cashback_analysis.py  # Cashback usage by converters
├── recalculate_frequency_unbiased.py    # Unbiased frequency calculation
├── verify_frequency_calculation.py      # Frequency methodology verification
└── club_member_breakdown_enhanced.py    # Club member categorization
```

---

## Key Calculations

### Frequency (Unbiased Method)
```
frequency = total_orders / (customers × calendar_months)
```
- Uses fixed calendar months for all customers (not first-to-last span)
- Before: 27 months (Jan 2023 - Mar 2025)
- After: 11 months (Apr 2025 - Mar 2026)

### TRUE Club Effect
```
TRUE Club Effect = Club Change % - Control Change %
TRUE Monthly Lift = Original Lift × (TRUE Effect / Club Change)
```

### Shipping Cost (Subsidy Zone)
- Zone: 199-449 DKK orders
- Club threshold: 199 DKK (vs non-Club 449 DKK)
- Cost = Incremental free orders × 39 DKK avg shipping

---

## Program Costs (Monthly)
- **Cashback:** ~360K DKK/mo (already reflected in profit figures)
- **Shipping Subsidy:** ~81.5K DKK/mo (incremental cost)
- **Fresh Customer Loss:** ~57K DKK/mo (lost conversions)

---

## Recent Changes (April 10, 2026)

### Control Group Analysis Added
- Validated frequency lift against non-Club control group
- Found 91% of claimed annual impact was natural behavior
- Revised annual estimate: 313K DKK (was 3.4M DKK)

### Fresh Customer Cashback Analysis
- Analyzed 24,533 converters for cashback usage
- Found only 12 used cashback (0.05%), totaling 762 DKK
- Monthly cost from cashback: ~85 DKK (negligible)

### Data Exclusions
- CE orders excluded (system orders, not customer purchases)
- One outlier customer with 2,009 orders identified and excluded

### UI Updates
- Segment cards now show TRUE Club effect (control-validated)
- Original values shown with strikethrough
- Control group comparison prominently displayed

---

## Summary for CEO

**Thesis 2: "Get returning & loyal customers to buy even more often"**

| Question | Answer |
|----------|--------|
| Did frequency increase? | Yes, +62% (Best), +404% (Medium) |
| Is it due to Club? | **Mostly NO** - control group showed similar improvement |
| What's the TRUE Club value? | ~313K DKK/year (not 3.4M as originally thought) |
| Why did control improve too? | Natural customer behavior, market trends, seasonality |

**Recommendation:** The frequency lift is real but NOT primarily Club-driven. Club's true incremental value is ~313K DKK/year from Medium Customers. Best Customers would have improved regardless of Club membership.
