# Feature Spec: AI Chat Agent

## Description
Natural-language interface for all accounting operations. The agent is the "heart" of the
project per assignment brief — it must be able to create/read/update entries, generate reports,
run audits, and answer free-form questions over the data.

## Endpoint
`POST /api/chat` — body: `{ "message": str, "history": list[ChatMessage] | None }`
Response: `{ "reply": str, "tool_calls": list[dict] | None }`

Every call is also persisted to `chat_messages` table (both user message and assistant reply),
satisfying Deliverable #6 (AI chat history) as a live audit trail in addition to your manual
prompt logs from Claude/Gemini/etc used during development.

## Agent tools (function-calling)
| Tool | Wraps service function | Purpose |
|---|---|---|
| create_entry_tool | services.entries.create_entry | Add expense/income from natural language |
| query_entries_tool | services.entries.list_entries | Answer "how much did we spend on X in March" |
| update_entry_tool | services.entries.update_entry | "change that rent entry to 55,000" |
| generate_pl_tool | services.reports.generate_pl | Produce P&L for a date range |
| generate_balance_sheet_tool | services.reports.generate_balance_sheet | Produce balance sheet |
| run_audit_tool | services.audit.run_monthly_audit | Run audit for a given month |

## System prompt requirements
- Agent must always use tools for any data operation — never fabricate numbers from its own
  knowledge.
- Agent must confirm destructive actions (update/delete) in plain language before calling the
  tool, unless the user has already been explicit ("yes, update it").
- Agent replies in the same language style the user used (Roman Urdu or English) — this is a
  product nicety, not a hard requirement, but improves the demo.
- If a query needs a date range and none is given, agent defaults to the current month and states
  that assumption in the reply.

## Edge cases
- Ambiguous category ("utilities" vs "electricity" — different casing/naming already in DB) →
  agent should query existing distinct categories first, then match/ask.
- User asks something entirely outside accounting scope → agent politely declines and stays on
  topic (system prompt guard).
- Tool call fails (DB error) → agent tells user the operation failed, does not pretend it
  succeeded.

## Acceptance criteria
- [ ] "Add office rent 50,000 for July" → creates one expense entry, category="rent".
- [ ] "How much did we spend on utilities in March?" → correct SUM from DB, not hallucinated.
- [ ] "Generate P&L for June" → calls generate_pl_tool, returns structured summary in chat.
- [ ] "Run audit for July" → calls run_audit_tool, lists flagged entries if any.