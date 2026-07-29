# Feature Spec: Additional Reports (Trial Balance, Cash Flow, Ratios, Recurring Detection, Category Consistency, YoY)

These extend the AI agent's task coverage per the assignment's research requirement. All work
against the existing `entries` table — no schema change needed.

## 1. Trial Balance
`GET /api/reports/trial-balance?from_date=&to_date=`
- Groups entries by category, shows debit column (expenses) and credit column (income) side by
  side, with running totals.
- Output: `{ rows: [{category, debit, credit}], total_debit, total_credit, balanced: bool }`
- `balanced` = total_debit == total_credit is NOT the check here (this isn't double-entry
  bookkeeping) — instead `balanced` just confirms totals reconcile with the entries table sum
  (sanity check, not a real trial balance equality test). State this limitation in the report.

## 2. Cash Flow Statement
`GET /api/reports/cash-flow?from_date=&to_date=`
- Since there's no investing/financing categorization, treat all entries as "operating
  activities" (state this simplification explicitly in output and README).
- Output: `{ period, cash_in (total income), cash_out (total expenses), net_cash_flow }`

## 3. Financial Ratio Analysis
`GET /api/reports/ratios?from_date=&to_date=`
- profit_margin = net_profit / total_income (as %)
- expense_to_income_ratio = total_expenses / total_income
- Skip current ratio, quick ratio, debt ratios — not computable without asset/liability data;
  state this explicitly rather than faking numbers.

## 4. Recurring Transaction Detection
`GET /api/reports/recurring?months=3` (default lookback 3 months)
- Groups entries by category + similar amount (within 5% tolerance) appearing in 2+ consecutive
  months → flags as "likely recurring" (e.g., rent, subscriptions).
- Output: `{ recurring: [{category, avg_amount, months_seen, entry_ids}] }`
- Not ML — simple pattern matching. State this honestly, same as the audit rules.

## 5. Category Consistency Check
`GET /api/reports/category-consistency`
- Detects near-duplicate category names (case differences, minor spelling variants) using simple
  string similarity (e.g. difflib.SequenceMatcher > 0.85 threshold).
- Output: `{ possible_duplicates: [{category_a, category_b, similarity_score}] }`
- Purpose: helps keep reports accurate (avoids "Utilities" and "utilities" splitting one category
  into two in P&L).

## 6. Year-over-Year Comparison
`GET /api/reports/yoy?category=&year_a=&year_b=`
- Compares total spend/income for the same category (or all categories if none given) across two
  years.
- Output: `{ category, year_a_total, year_b_total, change_amount, change_percent }`

## AI agent tools (add to specs/agents/ai-agent-spec.md)
`trial_balance_tool`, `cash_flow_tool`, `ratio_analysis_tool`, `recurring_detection_tool`,
`category_consistency_tool`, `yoy_comparison_tool` — each thin wrapper around the matching
service function, same pattern as existing tools.

## Acceptance criteria
- [ ] All six reports return zero/empty gracefully when no data exists — never an error.
- [ ] All six work identically whether called via REST endpoint or AI chat tool.
- [ ] Each report's response includes any relevant "simplification" note where the calculation
      isn't textbook-complete (ratios, cash flow) — never oversell what's actually computed.