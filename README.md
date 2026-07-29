# AI-Powered Accounting & Finance Assistant

Full-Stack AI Developer Intern Assignment — a web app that automates day-to-day accounting/CA
work: expense & income tracking, AI-driven natural-language data entry, P&L statement, simplified
balance sheet, monthly audit (anomaly detection), and natural-language Q&A over financial data.
Built using Spec-Driven Development (SDD).

## Submission status
_Update this section right before final submission — required by the assignment's submission
policy (state what's done, partially done, and pending)._

- **Done:** _(fill in)_
- **Partially done:** _(fill in)_
- **Pending:** _(fill in)_

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + TypeScript |
| Backend | Python, managed with `uv` |
| API framework | FastAPI |
| Validation | Pydantic v2 (all request/response models) |
| Database | PostgreSQL |
| Agent framework | OpenAI Agents SDK (function-calling tools) |
| AI model | gpt-4o-mini (fallback: Gemini 1.5 Flash) |
| Auth | JWT (HS256) + bcrypt |
| Containerization | Docker + docker-compose |

## Architecture principle
Frontend never talks to the database directly:
**Frontend → FastAPI REST endpoints → service layer → PostgreSQL.**
The AI agent's tools are thin wrappers around the same service-layer functions used by the REST
routers — so a manual entry and an AI-created entry always go through identical validation and
logic. See `CLAUDE.md` for the full rule set followed by any AI coding agent on this repo.

## Feature list (locked scope)
1. Expense entry (manual + AI natural language)
2. Income entry (manual + AI natural language)
3. AI chat agent (orchestrates all tools, natural-language Q&A)
4. Profit & Loss (P&L) statement
5. Simplified balance sheet (cash-position only — see scope note in `specs/features/balance-sheet.md`)
6. Monthly audit (rule-based anomaly detection)
7. Combined records/ledger view
8. Authentication (single-role, JWT-based login/signup)

## Repository structure
```
/CLAUDE.md               <- rules/context for any AI coding agent working on this repo
/README.md                <- this file
/research-paper/          <- Phase 1 deliverable (PDF)
/specs                     <- Spec-Driven Development docs, written before any code
  00-overview.md            tech stack, architecture, locked feature list, scope decisions
  workflow/                 system workflow diagram + shareable link (see Diagram section below)
  features/                 one spec per feature (inputs, outputs, endpoints, edge cases, acceptance criteria)
  api/api-contract.md       consolidated list of all API endpoints
  database/database-schema.md   full DB schema with design rationale
  agents/ai-agent-spec.md   AI agent tool definitions + system prompt requirements
  edge-cases/edge-cases.md  cross-feature edge cases (system-wide, not per-feature)
/backend
  /app
    /models                SQLAlchemy models
    /schemas                Pydantic schemas
    /services              business logic — shared by routers AND agent tools
    /routers                FastAPI routers
    /agent                 agent setup + tool definitions
    main.py
  pyproject.toml            managed via uv
  Dockerfile
/frontend
  /app
  Dockerfile
/chat-history/chathistory.md   log of every AI prompt used during development (Deliverable #6)
docker-compose.yml
```

## Workflow diagram (mandatory deliverable)
The full system workflow — user flow, AI agent flow (UI → API → agent → tools → database →
response), and data flow — is documented on **draw.io / Lucidchart** per the assignment's tool
requirement.

- Spec + reference sketch: `specs/workflow/workflow-link.md`
- Exported image: `specs/workflow/system-workflow.png` _(add once created)_
- Shareable URL: _(paste here once created — also update it in `specs/workflow/workflow-link.md`)_

**Status: pending — must still be created in draw.io/Lucidchart before submission.**

## Live deployment
- **Frontend (Vercel):** `https://your-app.vercel.app` _(replace with your Vercel URL)_
- **Backend API:** `https://your-backend.railway.app` _(replace with your Railway/Render URL)_
- **Research paper (Hugging Face):** `https://huggingface.co/your-username/your-paper` _(replace with your Hugging Face URL)_

## Setup & run — Docker (recommended)
```bash
git clone <repo-url>
cd <repo-name>
cp backend/.env.example backend/.env   # fill in DB URL, JWT_SECRET, AI API key
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

## Setup & run — manual (without Docker)
**Backend:**
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Environment variables
| Variable | Location | Purpose |
|---|---|---|
| DATABASE_URL | backend/.env | PostgreSQL connection string |
| JWT_SECRET | backend/.env | Signs auth tokens |
| OPENAI_API_KEY | backend/.env | AI agent |
| NEXT_PUBLIC_API_URL | frontend/.env.local | Backend base URL for frontend fetch calls |

**`.env` files are git-ignored and must never be committed.** No AI coding agent working on this
repo is permitted to read or access them (see `CLAUDE.md` security rule).

## Deliverables checklist
| # | Deliverable | Location / Link |
|---|---|---|
| 1 | Live deployment link | **Vercel:** `https://your-app.vercel.app` _(replace with your URL)_ |
| 2 | Research paper (PDF) | **Hugging Face:** `https://huggingface.co/your-username/your-paper` _(replace with your URL)_ |
| 3 | Workflow diagram URL | `specs/workflow/workflow-link.md` — pending |
| 4 | GitHub repo URL | this repo |
| 5 | Docker setup | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` |
| 6 | AI chat history | `chat-history/chathistory.md` |

## AI tools used during development
Claude (research support, specs, architecture, prompts), OpenCode (backend implementation),
Lovable (frontend generation). Full prompt-by-prompt log in `chat-history/chathistory.md`.
