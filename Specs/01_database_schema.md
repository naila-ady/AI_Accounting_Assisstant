# Database Schema Spec

## Table: entries
The single source of truth for all financial transactions (expenses AND income use the same
table, distinguished by `entry_type`). This is the standard accounting-friendly design — it makes
P&L, balance sheet, and audit queries simple aggregations over one table.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | default gen_random_uuid() |
| entry_type | ENUM('expense','income') | required |
| category | VARCHAR(100) | e.g. "rent", "utilities", "sales", "salary" |
| amount | NUMERIC(14,2) | required, > 0 |
| description | TEXT | optional |
| entry_date | DATE | required — the date the transaction occurred |
| payment_method | VARCHAR(50) | cash / bank / other, optional |
| source | ENUM('manual','ai') | how the entry was created |
| created_at | TIMESTAMP | default now() |
| updated_at | TIMESTAMP | default now(), auto-update |

Indexes: `entry_date`, `entry_type`, `category` (all queried heavily by reports).

## Table: audit_flags
Stores results of monthly audit runs (so audit history persists, not just recomputed live).

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| period | VARCHAR(7) | e.g. "2026-07" |
| entry_id | UUID (FK -> entries.id) | the flagged entry |
| flag_reason | VARCHAR(255) | e.g. "amount > 3x category average", "missing category" |
| severity | ENUM('low','medium','high') | |
| created_at | TIMESTAMP | default now() |

## Table: chat_messages
Stores AI chat history (also doubles as part of Deliverable #6 — AI chat history).

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| role | ENUM('user','assistant') | |
| content | TEXT | |
| tool_calls | JSONB | nullable, stores which tool(s) were invoked |
| created_at | TIMESTAMP | default now() |

## Design rationale
- Single `entries` table (not separate expense/income tables) → P&L is one `GROUP BY entry_type,
  category` query, not a UNION across tables.
- `source` column lets you demo/prove "AI-created vs manually-created" entries in the review.
- `audit_flags` persists results so the audit view doesn't need to recompute every page load.