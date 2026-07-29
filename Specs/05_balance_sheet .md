# Feature Spec: Balance Sheet

## Scope decision (important — read before building)
A textbook balance sheet needs Assets/Liabilities/Equity accounts, which this project's simple
`entries` table does not model (no fixed-asset register, no loan/liability tracking module in
scope). Building a full balance sheet would require a chart-of-accounts system — out of scope for
a 1-week intern assignment. Instead we implement a **simplified cash-position balance sheet**,
which is a legitimate accounting simplification and should be stated explicitly in your research
paper / README so reviewers know it's a deliberate scope decision, not a missed requirement.

## Endpoint
`GET /api/reports/balance-sheet?as_of_date=`

## Output schema (BalanceSheetReport)
```python
as_of_date: date
cash_position: Decimal          # cumulative income - cumulative expenses, all-time up to date
total_income_to_date: Decimal
total_expenses_to_date: Decimal
note: str = "Simplified cash-position balance sheet (no fixed assets/liabilities tracked)"
```

## Logic
```sql
SELECT
  SUM(CASE WHEN entry_type='income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN entry_type='expense' THEN amount ELSE 0 END) AS total_expenses
FROM entries WHERE entry_date <= :as_of_date;
```
cash_position = total_income - total_expenses.

## Edge cases
- No entries before as_of_date → all zeros.
- as_of_date in the future → 422 validation error.

## Acceptance criteria
- [ ] Report always labeled "simplified" in UI and API response — no false precision claimed.
- [ ] Numbers reconcile with P&L net_profit summed across all periods up to as_of_date.