# Feature Spec: Monthly Audit

## Description
Runs anomaly-detection checks over one month's entries and produces a list of flagged items —
this is the AI-automation piece the assignment specifically calls out ("anomaly detection in
audits").

## Endpoint
`POST /api/reports/audit?period=2026-07` → AuditReport (also persists rows to `audit_flags`)

## Output schema (AuditReport)
```python
period: str
total_entries_checked: int
flags: list[AuditFlag]

# AuditFlag
entry_id: UUID
category: str
amount: Decimal
flag_reason: str
severity: Literal["low","medium","high"]
```

## Audit rules (deterministic, run in this order)
1. **Missing/empty category** → severity high.
2. **Amount is a statistical outlier**: amount > (category average for that month * 3) AND
   category has >= 3 other entries that month → severity medium.
3. **Duplicate entry**: same category + amount + entry_date appearing more than once → severity
   low ("possible duplicate, verify").
4. **Round-number large expense**: expense amount is a round number (ends in 000) AND > 50,000 →
   severity low ("verify — large round-number expense").

## Logic notes
- Rules run in Python over the month's entries (fetched via existing `list_entries` service, not
  raw SQL duplication) — keeps rules testable and out of SQL.
- Rules are simple/statistical, not ML — this is intentional and should be described honestly in
  the research paper as "rule-based anomaly detection" rather than oversold as advanced ML.

## Edge cases
- Month with < 3 entries in a category → skip the outlier rule for that category (not enough data
  to compute a meaningful average).
- No flags found → return empty list, not an error.

## Acceptance criteria
- [ ] Same period run twice does not duplicate rows in `audit_flags` (delete-and-reinsert for that
      period, or upsert on period+entry_id).
- [ ] AI tool `run_audit_tool` returns the same flags as the REST endpoint.