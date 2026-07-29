# Feature Spec: Profit & Loss Statement

## Description
Generate P&L for a given date range from real `entries` data (never hard-coded).

## Endpoint
`GET /api/reports/pl?from_date=&to_date=` → PLReport

## Output schema (PLReport)
```python
period: str                     # "2026-07-01 to 2026-07-31"
total_income: Decimal
total_expenses: Decimal
net_profit: Decimal             # income - expenses
income_by_category: dict[str, Decimal]
expenses_by_category: dict[str, Decimal]
```

## Logic
```sql
SELECT category, SUM(amount) FROM entries
WHERE entry_type = 'income' AND entry_date BETWEEN :from AND :to
GROUP BY category;
-- same for expense
```
net_profit = total_income - total_expenses.

## Edge cases
- No entries in range → all totals = 0, empty category dicts, no error.
- from_date > to_date → 422 validation error.
- Range spans multiple years → still works, no special casing needed (pure date filter).

## Acceptance criteria
- [ ] Numbers match manual SUM query against the same DB.
- [ ] AI tool `generate_pl_tool` and REST endpoint return identical numbers for same range.