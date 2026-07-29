from datetime import date, datetime

import openai
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.tools import TOOL_DEFINITIONS
from app.config import settings
from app.models.chat_message import ChatMessage
from app.schemas.chat import ChatMessageOut, ChatResponse
from app.schemas.entry import EntryCreate, EntryUpdate
from app.services.entries import create_entry, get_entry, list_categories, list_entries, update_entry
from app.services.reports import (
    check_category_consistency, detect_recurring, generate_balance_sheet,
    generate_cash_flow, generate_pl, generate_ratios, generate_trial_balance,
    generate_yoy, run_monthly_audit,
)

SYSTEM_PROMPT = """You are an AI accounting assistant for a small business. You help with recording expenses and income, answering questions about financial data, generating reports (P&L, balance sheet), and running audits.

Rules:
1. ALWAYS use the available tools for any data operation. Never fabricate numbers from your own knowledge.
2. Before updating or deleting entries, ask the user to confirm in plain language first, unless the user has already explicitly told you to proceed.
3. If a date range is not specified, assume the current month and state that assumption in your reply.
4. If a category is ambiguous, query existing categories first to find a match.
5. If asked about non-accounting topics, politely decline and steer back to accounting.
6. Reply in the same language style the user used (Roman Urdu or English).
7. For entry dates, default to today if not specified.
8. Currency is PKR (Pakistani Rupees).
9. When creating entries, the entry_type must be either "expense" or "income", and the amount must be a positive number.
10. If amount or category is missing or ambiguous, ask a clarifying question instead of guessing."""


async def process_chat_message(
    db: AsyncSession,
    user_message: str,
    history: list[dict] | None,
) -> ChatResponse:
    if not settings.OPENAI_API_KEY:
        return ChatResponse(
            reply="AI assistant is not configured. Please set the OPENAI_API_KEY environment variable.",
            tool_calls=None,
        )

    extras = settings.__pydantic_extra__ or {}
    base_url = extras.get("ai_api_url") or "https://api.openai.com/v1"
    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=base_url)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if history:
        for msg in history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    messages.append({"role": "user", "content": user_message})

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
        )
    except openai.APIError as e:
        return ChatResponse(reply=f"AI service error: {e}", tool_calls=None)

    choice = response.choices[0]
    assistant_message = choice.message

    if not assistant_message.tool_calls:
        reply = assistant_message.content or ""
        return ChatResponse(reply=reply, tool_calls=None)

    tool_call_records = []
    for tc in assistant_message.tool_calls:
        tool_call_records.append({"id": tc.id, "name": tc.function.name, "arguments": tc.function.arguments})

    messages.append({
        "role": "assistant",
        "content": assistant_message.content or "",
        "tool_calls": [
            {"id": tc.id, "function": {"name": tc.function.name, "arguments": tc.function.arguments}, "type": "function"}
            for tc in assistant_message.tool_calls
        ],
    })

    for tc in assistant_message.tool_calls:
        result = await _execute_tool(db, tc.function.name, tc.function.arguments)
        messages.append({
            "role": "tool",
            "tool_call_id": tc.id,
            "content": str(result),
        })

    try:
        final_response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
        )
    except openai.APIError as e:
        return ChatResponse(reply=f"AI service error while processing tool results: {e}", tool_calls=tool_call_records)

    final_choice = final_response.choices[0]
    final_content = final_choice.message.content or ""

    return ChatResponse(reply=final_content, tool_calls=tool_call_records)


async def _execute_tool(db: AsyncSession, tool_name: str, args_json: str) -> str:
    import json

    try:
        args = json.loads(args_json)
    except json.JSONDecodeError:
        return "Error: invalid arguments JSON"

    try:
        if tool_name == "create_entry":
            args["source"] = "ai"
            if "entry_date" not in args or not args["entry_date"]:
                args["entry_date"] = date.today().isoformat()
            data = EntryCreate(**args)
            entry = await create_entry(db, data)
            return json.dumps({"id": str(entry.id), "entry_type": entry.entry_type, "category": entry.category, "amount": str(entry.amount), "entry_date": str(entry.entry_date), "source": entry.source}, default=str)

        elif tool_name == "query_entries":
            if "from_date" in args:
                args["from_date"] = date.fromisoformat(args["from_date"])
            if "to_date" in args:
                args["to_date"] = date.fromisoformat(args["to_date"])
            items, total = await list_entries(db, **args)
            return json.dumps({"total": total, "items": [{"id": str(i.id), "entry_type": i.entry_type, "category": i.category, "amount": str(i.amount), "description": i.description, "entry_date": str(i.entry_date), "source": i.source} for i in items]}, default=str)

        elif tool_name == "update_entry":
            from uuid import UUID
            entry_id = UUID(args.pop("entry_id"))
            data = EntryUpdate(**args)
            entry = await update_entry(db, entry_id, data)
            if entry is None:
                return json.dumps({"error": "Entry not found"})
            return json.dumps({"id": str(entry.id), "entry_type": entry.entry_type, "category": entry.category, "amount": str(entry.amount), "entry_date": str(entry.entry_date)})

        elif tool_name == "generate_pl":
            from_date = date.fromisoformat(args["from_date"])
            to_date = date.fromisoformat(args["to_date"])
            report = await generate_pl(db, from_date, to_date)
            return json.dumps(report.model_dump(), default=str)

        elif tool_name == "generate_balance_sheet":
            as_of_date = date.fromisoformat(args["as_of_date"])
            report = await generate_balance_sheet(db, as_of_date)
            return json.dumps(report.model_dump(), default=str)

        elif tool_name == "trial_balance":
            from_date = date.fromisoformat(args["from_date"])
            to_date = date.fromisoformat(args["to_date"])
            report = await generate_trial_balance(db, from_date, to_date)
            return json.dumps(report.model_dump(), default=str)

        elif tool_name == "cash_flow":
            from_date = date.fromisoformat(args["from_date"])
            to_date = date.fromisoformat(args["to_date"])
            report = await generate_cash_flow(db, from_date, to_date)
            return json.dumps(report.model_dump(), default=str)

        elif tool_name == "ratio_analysis":
            from_date = date.fromisoformat(args["from_date"])
            to_date = date.fromisoformat(args["to_date"])
            report = await generate_ratios(db, from_date, to_date)
            return json.dumps(report.model_dump(), default=str)

        elif tool_name == "recurring_detection":
            months = args.get("months", 3)
            report = await detect_recurring(db, months)
            return json.dumps(report.model_dump(), default=str)

        elif tool_name == "category_consistency":
            report = await check_category_consistency(db)
            return json.dumps(report.model_dump(), default=str)

        elif tool_name == "yoy_comparison":
            category = args.get("category")
            year_a = int(args["year_a"])
            year_b = int(args["year_b"])
            report = await generate_yoy(db, category, year_a, year_b)
            return json.dumps(report.model_dump(), default=str)

        elif tool_name == "run_audit":
            report = await run_monthly_audit(db, args["period"])
            return json.dumps(report.model_dump(), default=str)

        else:
            return f"Error: unknown tool '{tool_name}'"
    except Exception as e:
        return f"Error executing {tool_name}: {str(e)}"


async def get_chat_history(db: AsyncSession, limit: int = 50) -> list[ChatMessage]:
    result = await db.execute(
        select(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


async def persist_messages(db: AsyncSession, user_msg: str, assistant_reply: str, tool_calls: list[dict] | None):
    db.add(ChatMessage(role="user", content=user_msg))
    db.add(ChatMessage(role="assistant", content=assistant_reply, tool_calls=tool_calls))
    await db.flush()
