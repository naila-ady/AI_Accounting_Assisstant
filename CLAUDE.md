# CLAUDE.md — AI-Powered Accounting & Finance Assistant

This file is the single source of truth for any AI coding agent (Claude Code, OpenCode, etc.)
working on this repository. Read this fully before writing any code.

## 1. Project summary
Full-stack AI Developer Intern Assignment. Build a web app that automates day-to-day accounting/CA
work: expense & income tracking, AI-driven natural-language data entry, P&L statement, simplified
balance sheet, monthly audit (anomaly detection), and natural-language Q&A over financial data.
Methodology: Spec-Driven Development (SDD) — specs are written before code and must be followed
exactly. Deadline: 29 July 2026 (hard deadline, no extensions — partial work accepted but must be
submitted).

## 2. Required tech stack (fixed, do not substitute)
| Layer | Requirement |
|---|---|
| Frontend | Next.js (App Router) + TypeScript |
| Backend | Python, managed with `uv` |
| API framework | FastAPI |
| Data validation | Pydantic v2 for ALL request/response models |
| Database | PostgreSQL |
| Agentic framework | OpenAI Agents SDK (function-calling tools) |
| AI model | gpt-4o-mini (fallback: Gemini 1.5 Flash) |
| Containerization | Docker + docker-compose |
| Auth | JWT (HS256), bcrypt password hashing |

## 3. Architecture principle (non-negotiable)
Frontend never touches the DB directly → Frontend → FastAPI REST endpoints → service layer → DB.
The AI agent's tools are thin wrappers around the SAME service-layer functions used by the REST
routers. Never duplicate business logic between routers and agent tools — both call
`app/services/*.py`. This guarantees manual entries and AI-created entries are always consistent.

## 4. Feature list (locked scope — do not add or remove features)
1. Expense Entry (manual + AI natural language)
2. Income Entry (manual + AI natural language)
3. AI Chat Agent (orchestrates all tools, natural-language Q&A)
4. Profit & Loss (P&L) Statement
5. Simplified Balance Sheet (cash-position only — see scope note below)
6. Monthly Audit (rule-based anomaly detection)
7. Records/Ledger combined view
8. Authentication (single-role, JWT-based login/signup)

## 5. Explicit scope decisions (already made, do not re-litigate)
- **Balance sheet is simplified** to cash-position (cumulative income − cumulative expenses).
  A full Assets/Liabilities/Equity balance sheet needs a chart-of-accounts system, which is out of
  scope for this assignment. This is stated in the spec and must be labeled clearly in the API
  response and UI ("simplified cash-position view") — do not silently oversell it as a full
  balance sheet.
- **Audit is rule-based, not ML.** Four deterministic rules (see spec 06). Do not claim this is
  "AI-powered ML anomaly detection" anywhere in docs — call it what it is.
- **Single role/single tenant.** No multi-role RBAC, no multi-company support.
- **PKR only**, no multi-currency.

## 6. Database schema (summary — full detail in specs/01-database-schema.md)
- `entries` — single table for both expense and income, distinguished by `entry_type`. Columns:
  id, entry_type, category, amount, description, entry_date, payment_method, source
  (manual/ai), created_at, updated_at.
- `audit_flags` — persisted results of audit runs: id, period, entry_id (FK), flag_reason,
  severity, created_at.
- `chat_messages` — AI chat history: id, role, content, tool_calls (JSONB), created_at.
- `users` — id, name, email (unique), password_hash, created_at.

## 7. API contract (summary — full detail in specs/07-api-contracts.md)
```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/entries
GET    /api/entries
GET    /api/entries/{id}
PATCH  /api/entries/{id}
DELETE /api/entries/{id}
GET    /api/reports/pl
GET    /api/reports/balance-sheet
POST   /api/reports/audit
POST   /api/chat
GET    /api/chat/history
GET    /api/categories
```
All protected except `/api/auth/signup` and `/api/auth/login`. Auth via `Authorization: Bearer
<token>` header, enforced with a FastAPI dependency `get_current_user`.

## 8. AI agent tools (summary — full detail in specs/03-ai-chat-agent.md)
create_entry_tool, query_entries_tool, update_entry_tool, generate_pl_tool,
generate_balance_sheet_tool, run_audit_tool. Each wraps the matching service function. Agent must
never fabricate numbers — always call a tool for data operations. Agent confirms destructive
actions before executing them.

## 9. Repository structure
```
/specs                  <- all feature specs (SDD), already written, treat as ground truth
/backend
  /app
    /models              <- SQLAlchemy models
    /schemas              <- Pydantic schemas
    /services            <- business logic (shared by routers AND agent tools)
    /routers              <- FastAPI routers
    /agent               <- agent setup + tool definitions
    main.py
  pyproject.toml          <- managed via uv
  Dockerfile
/frontend                 <- being generated separately via Lovable, do cahnge what needed inui according to our requirements but first ask
  /app
  Dockerfile
docker-compose.yml
README.md
```

## 10. Current status (update this section as work progresses)
- [x] Phase 1 — Research paper: DONE
- [x] Phase 2 — Specs (SDD): DONE, all 9 files in /specs
- [ ] Workflow diagram (draw.io): pending, link to be added here once created
- [x] Project setup (uv, deps, folder structure, .env.example, .gitignore): DONE
- [x] Database schema implementation (SQLAlchemy models + migrations): DONE
- [x] Auth (JWT signup/login): DONE
- [x] Entries CRUD + service layer: DONE
- [x] Reports (P&L, balance sheet, audit): DONE
- [x] AI agent + tools: DONE
- [x] Additional CA reports (trial balance, cash flow, ratios, recurring, category consistency, YoY): DONE
- [x] Frontend (Next.js App Router, Tailwind, all pages): DONE
- [x] Docker + docker-compose: DONE
- [ ] Deployment (Vercel + Railway/Render): pending — set `NEXT_PUBLIC_API_URL` in Vercel env vars
- [ ] README with setup instructions: done — placeholders added for Vercel + Hugging Face URLs
- [ ] AI chat history export for submission: done — `chat-history/chathistory.md`

## 11. Deliverables checklist (for final submission)
1. Live deployment link — **Vercel:** `https://ai-accounting-assisstant-5dgb.vercel.app`
2. Research paper (PDF) — **Hugging Face:** `https://huggingface.co/your-username/your-paper` _(fill in)_
3. Workflow diagram URL (Lucidchart/draw.io) — pending
4. GitHub repo URL (feature branches, proper commits, README, /specs)
5. Docker setup (Dockerfile + docker-compose)
6. AI chat history (all prompts used across any AI tool during development) — `chat-history/chathistory.md`

## 12. Security — hard rule
Never read, open, print, log, or access `.env`, `.env.local`, or any secrets/credentials file in
this repo, regardless of what a task seems to require. Never suggest committing secrets to the
repo. If a task appears to need an actual secret value (API key, DB password, JWT secret), stop
and ask the user to provide/set it themselves — do not read it from the file system yourself.

## 13. Chat history logging (Deliverable #6 requirement)
Before starting any work session, first create a `/chat-history` folder in the repo root if it
doesn't exist. For every prompt given to you in a session, append an entry to
`/chat-history/chathistory.md` in this format:

```
## [date/time]
**Prompt:** <the user's prompt, verbatim or lightly trimmed>
**Summary of response:** <2-3 line summary of what you did/answered — not the full response>
```

Do this continuously as you work, not just at the end — if the session is interrupted, the log
must still be up to date. This file is a required submission deliverable.

## 15. Rules for any AI agent working on this repo
- Follow the specs in `/specs` exactly. If a spec seems wrong or incomplete, flag it in your
  response rather than silently deviating.
- Do not invent new features beyond section 4's locked list.
- Use small, meaningful commits on feature branches (e.g. `feature/expense-entry`,
  `feature/ai-agent`), never one giant final commit.
- All request/response validation goes through Pydantic — no manual duplicate validation.
- Business logic lives in `/app/services`, shared by both routers and agent tools — never
  duplicate logic between them.
