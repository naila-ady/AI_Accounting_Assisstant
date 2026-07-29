# Consolidated Edge Cases

Cross-feature edge cases not fully captured within a single feature spec. Per-feature edge cases
live in their own spec files under `/features` — this file covers system-wide and cross-cutting
concerns only.

## Data integrity
- Manual entry and AI-created entry for the same real-world transaction both get saved (no
  automatic dedup) — system only soft-warns via the AI, never silently merges or blocks.
- Entry deleted while an audit report referencing it already exists → `audit_flags.entry_id`
  becomes a dangling reference. Handle via `ON DELETE CASCADE` on the FK, or soft-delete entries
  instead of hard delete (recommended: soft-delete with `deleted_at` column, exclude from all
  queries — decide during implementation and document the choice in CLAUDE.md).

## Auth & session
- Token expires mid-chat-session (7-day expiry) → next API call returns 401, frontend must
  redirect to login without losing the in-progress chat draft (store draft in local component
  state until redirect).
- Two browser tabs, user logs out in one → other tab's next API call fails on 401 and redirects
  (no real-time session sync required — acceptable for this scope).

## AI agent
- Agent tool call takes too long / API rate limit hit (OpenAI/Gemini) → return a clear error to
  chat ("AI service is temporarily unavailable, please try again"), never leave the chat hanging
  with no response.
- User sends a message in Roman Urdu with financial terms mixed in English (very likely given
  actual usage) → agent must still correctly extract amount/category/date; test this explicitly,
  don't assume English-only input.
- Agent given an ambiguous month reference ("last month") → resolve relative to server's current
  date, state the resolved date range explicitly in the reply so the user can correct it if wrong.

## Reports
- P&L and balance sheet requested for a period with zero entries → return valid zero-value
  response, not a 404 or error (already noted per-feature, repeated here as a system-wide rule:
  **empty data is never an error state** anywhere in this app).
- Concurrent audit runs for the same period (double-click "Run audit") → second call should
  upsert/replace flags for that period, not create duplicate rows (see database schema decision).

## Currency & numbers
- All amounts stored as `NUMERIC(14,2)` — never use floats anywhere in the codebase (backend or
  frontend) to avoid rounding errors in financial totals.
- Frontend must format all currency displays consistently (Rs. with thousands separator) — no
  raw unformatted numbers shown to the user anywhere.

## Deployment
- Environment variables (DB connection string, JWT secret, AI API key) must never be committed to
  the repo. `.env` must be in `.gitignore`. Deployed environments (Vercel/Railway) get these set
  via their dashboard, not via code.