from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.entries import create_entry as _create_entry
from app.services.entries import list_entries as _list_entries
from app.services.entries import update_entry as _update_entry
from app.services.reports import (
    check_category_consistency as _check_category_consistency,
    detect_recurring as _detect_recurring,
    generate_balance_sheet as _generate_balance_sheet,
    generate_cash_flow as _generate_cash_flow,
    generate_pl as _generate_pl,
    generate_ratios as _generate_ratios,
    generate_trial_balance as _generate_trial_balance,
    generate_yoy as _generate_yoy,
    run_monthly_audit as _run_audit,
)

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "create_entry",
            "description": "Create an expense or income entry. Always use this for adding financial records.",
            "parameters": {
                "type": "object",
                "properties": {
                    "entry_type": {"type": "string", "enum": ["expense", "income"], "description": "expense or income"},
                    "category": {"type": "string", "description": "e.g. rent, utilities, salary, sales"},
                    "amount": {"type": "number", "description": "positive number"},
                    "description": {"type": "string", "description": "optional description"},
                    "entry_date": {"type": "string", "description": "YYYY-MM-DD, defaults to today if not specified"},
                    "payment_method": {"type": "string", "description": "cash, bank, or other (optional)"},
                },
                "required": ["entry_type", "category", "amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_entries",
            "description": "Query/search expense and income entries with optional filters.",
            "parameters": {
                "type": "object",
                "properties": {
                    "entry_type": {"type": "string", "enum": ["expense", "income"]},
                    "category": {"type": "string"},
                    "from_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "to_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "page": {"type": "integer", "default": 1},
                    "page_size": {"type": "integer", "default": 20},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_entry",
            "description": "Update an existing entry by ID. Confirm with the user before calling.",
            "parameters": {
                "type": "object",
                "properties": {
                    "entry_id": {"type": "string", "description": "UUID of the entry to update"},
                    "entry_type": {"type": "string", "enum": ["expense", "income"]},
                    "category": {"type": "string"},
                    "amount": {"type": "number"},
                    "description": {"type": "string"},
                    "entry_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "payment_method": {"type": "string"},
                },
                "required": ["entry_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_pl",
            "description": "Generate a Profit & Loss statement for a given date range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "to_date": {"type": "string", "description": "YYYY-MM-DD"},
                },
                "required": ["from_date", "to_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_balance_sheet",
            "description": "Generate a simplified cash-position balance sheet as of a given date.",
            "parameters": {
                "type": "object",
                "properties": {
                    "as_of_date": {"type": "string", "description": "YYYY-MM-DD"},
                },
                "required": ["as_of_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "trial_balance",
            "description": "Generate a trial balance showing debit (expenses) and credit (income) columns grouped by category for a date range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_date": {"type": "string", "description": "YYYY-MM-DD, start date"},
                    "to_date": {"type": "string", "description": "YYYY-MM-DD, end date"},
                },
                "required": ["from_date", "to_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cash_flow",
            "description": "Generate a cash flow statement (operating activities only) for a date range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "to_date": {"type": "string", "description": "YYYY-MM-DD"},
                },
                "required": ["from_date", "to_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ratio_analysis",
            "description": "Calculate financial ratios (profit margin, expense-to-income ratio) for a date range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "to_date": {"type": "string", "description": "YYYY-MM-DD"},
                },
                "required": ["from_date", "to_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "recurring_detection",
            "description": "Detect likely recurring transactions (same category, similar amount, consecutive months).",
            "parameters": {
                "type": "object",
                "properties": {
                    "months": {"type": "integer", "description": "Number of months to look back (default 3)", "default": 3},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "category_consistency",
            "description": "Check for near-duplicate category names that should be merged.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "yoy_comparison",
            "description": "Compare income/expenses for a category (or all categories) across two years.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "Optional category filter"},
                    "year_a": {"type": "integer", "description": "First year (e.g. 2025)"},
                    "year_b": {"type": "integer", "description": "Second year (e.g. 2026)"},
                },
                "required": ["year_a", "year_b"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_audit",
            "description": "Run anomaly detection audit for a given month.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {"type": "string", "description": "YYYY-MM format, e.g. 2026-07"},
                },
                "required": ["period"],
            },
        },
    },
]

TOOL_HANDLER_MAP = {
    "create_entry": _create_entry,
    "query_entries": _list_entries,
    "update_entry": _update_entry,
    "generate_pl": _generate_pl,
    "generate_balance_sheet": _generate_balance_sheet,
    "trial_balance": _generate_trial_balance,
    "cash_flow": _generate_cash_flow,
    "ratio_analysis": _generate_ratios,
    "recurring_detection": _detect_recurring,
    "category_consistency": _check_category_consistency,
    "yoy_comparison": _generate_yoy,
    "run_audit": _run_audit,
}
