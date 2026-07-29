# Spec-Driven Development — Overview

## Project
AI-Powered Accounting & Finance Assistant

## Feature list (locked scope)
1. Expense Entry (manual + AI natural language)
2. Income Entry (manual + AI natural language)
3. AI Chat Agent (orchestrates all tools below)
4. Profit & Loss (P&L) Statement Generation
5. Balance Sheet Generation
6. Monthly Audit
7. Natural-language Q&A over financial data
8. Records/Ledger List View

## Tech stack (fixed)
- Frontend: Next.js 14+ (App Router) + TypeScript
- Backend: FastAPI, managed with `uv`
- Validation: Pydantic v2 for all request/response models
- Database: PostgreSQL (Neon/Supabase for hosting)
- Agent framework: OpenAI Agents SDK (function-calling tools that call backend service functions directly)
- AI model: gpt-4o-mini (free-tier friendly, strong function-calling) — fallback: Gemini 1.5 Flash
- Containerization: Docker + docker-compose

## Architecture principle
Frontend never talks to the DB directly. Frontend → FastAPI REST endpoints → service layer → DB.
AI agent also goes through the SAME service layer (not raw SQL, not duplicate logic) — the agent's
tools are thin wrappers that call the same Python functions the REST endpoints call. This guarantees
manual entries and AI entries are always consistent.

## Roles (kept minimal for this assignment)
Single role: "admin/office user" — no multi-role auth required. Auth can be a single hardcoded
API key / simple session for demo purposes (not the focus of grading).

## Non-goals (explicitly out of scope, do not build)
- Multi-tenant / multi-company support
- Multi-role RBAC (Customer/Painter/Dealer type systems — that's a different project)
- Real payment gateway integration
- Mobile app

## Folder structure
```
/specs                  <- this folder
/backend
  /app
    /models              <- SQLAlchemy models
    /schemas              <- Pydantic schemas
    /services            <- business logic (used by both API routes and AI tools)
    /routers              <- FastAPI routers
    /agent               <- agent setup + tool definitions
    main.py
  pyproject.toml
  Dockerfile
/frontend
  /app
  Dockerfile
docker-compose.yml
README.md
```
