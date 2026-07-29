# Feature Spec: Expense & Income Entry
 
## Description
User can record a financial entry two ways: (1) filling a form in the UI, (2) telling the AI in
natural language (e.g. "Add office rent 50,000 for July"). Both paths call the same backend
service function `create_entry()`.
 
## Inputs (Pydantic schema — EntryCreate)
```python
entry_type: Literal["expense", "income"]
category: str            # min_length=1, max_length=100
amount: Decimal           # gt=0
description: str | None = None
entry_date: date          # cannot be in the future
payment_method: str | None = None
source: Literal["manual", "ai"] = "manual"
```
 
## Outputs (EntryOut)
Same fields + `id`, `created_at`, `updated_at`.
 
## Endpoints
- `POST /api/entries` — create (manual)
- `GET /api/entries?entry_type=&category=&from_date=&to_date=&page=&page_size=` — list/filter
- `GET /api/entries/{id}` — single entry
- `PATCH /api/entries/{id}` — update
- `DELETE /api/entries/{id}` — delete
## AI tool: create_entry_tool
- Input: same as EntryCreate but `source` is hardcoded to "ai" by the tool itself, not the model.
- The agent must extract: type (expense/income), category, amount, date (default = today if not
  stated), description.
- If amount or category is missing/ambiguous, the agent must ask a clarifying question instead of
  guessing.
## Edge cases
- Negative or zero amount → 422 validation error.
- Future-dated entry_date → 422 validation error.
- Category not in a predefined suggestion list → still accepted (free text), but UI shows
  autocomplete from existing categories in DB.
- Duplicate-looking entry (same amount + category + date within same day) → backend does NOT
  block it, but AI tool response should mention "similar entry already exists on this date" as a
  soft warning, not a hard error.
- Currency: PKR only for this project, no multi-currency.
## Acceptance criteria
- [ ] Creating via form and via AI chat both produce identical rows in `entries` table (only
      `source` differs).
- [ ] List endpoint supports date-range + category filtering, used by all reports.
- [ ] All validation happens via Pydantic — no manual `if` checks duplicating validation logic.
 


