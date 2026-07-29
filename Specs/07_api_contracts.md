# API Contract Summary

All request/response bodies use Pydantic models (see individual feature specs for exact fields).

| Method | Path | Purpose |
|---|---|---|
| POST | /api/entries | Create expense/income entry |
| GET | /api/entries | List/filter entries |
| GET | /api/entries/{id} | Get single entry |
| PATCH | /api/entries/{id} | Update entry |
| DELETE | /api/entries/{id} | Delete entry |
| GET | /api/reports/pl | Profit & Loss statement |
| GET | /api/reports/balance-sheet | Simplified balance sheet |
| POST | /api/reports/audit | Run monthly audit |
| POST | /api/chat | AI agent chat endpoint |
| GET | /api/chat/history | Get chat message history |
| GET | /api/categories | Distinct categories in use (for autocomplete + agent disambiguation) |

## Standard error format
```python
{ "detail": str }   # FastAPI default — keep it, don't customize unnecessarily
```

## Standard success wrapper
No envelope — return the Pydantic model directly (FastAPI default). Keeps frontend fetch code
simple.