from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.entry import EntryOut


class CategoryBreakdown(BaseModel):
    category: str
    total: Decimal
    count: int


class PeriodInfo(BaseModel):
    start: date
    end: date


class MonthlyNet(BaseModel):
    month: str
    income: Decimal
    expense: Decimal


class PLReport(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_profit: Decimal
    income_by_category: list[CategoryBreakdown]
    expense_by_category: list[CategoryBreakdown]
    period: PeriodInfo


class BalanceSheetReport(BaseModel):
    cash_position: Decimal
    total_income: Decimal
    total_expenses: Decimal
    as_of: date
    note: str = (
        "This is a simplified cash-position balance sheet — "
        "it shows cumulative income minus cumulative expenses only. "
        "A full balance sheet (Assets / Liabilities / Equity) is out of scope."
    )


class AuditFlagOut(BaseModel):
    id: UUID
    entry_id: UUID
    flag_reason: str
    severity: str
    category: str
    created_at: datetime


class SeveritySummary(BaseModel):
    high: int
    medium: int
    low: int


class AuditReport(BaseModel):
    period: str
    total_entries_checked: int
    flags: list[AuditFlagOut]
    summary: SeveritySummary


class TrialBalanceRow(BaseModel):
    category: str
    debit: Decimal
    credit: Decimal


class TrialBalanceReport(BaseModel):
    rows: list[TrialBalanceRow]
    total_debit: Decimal
    total_credit: Decimal
    balanced: bool
    note: str = (
        "This is a simplified trial balance — it groups entries by category "
        "showing expenses as debits and income as credits. "
        "It is NOT a double-entry accounting trial balance; "
        "\"balanced\" here confirms totals reconcile with the entries table sum."
    )


class CashFlowReport(BaseModel):
    period: PeriodInfo
    cash_in: Decimal
    cash_out: Decimal
    net_cash_flow: Decimal
    note: str = (
        "All entries are classified as operating activities since "
        "this system does not track investing/financing activity categories."
    )


class RatioReport(BaseModel):
    period: PeriodInfo
    profit_margin: Decimal | None
    expense_to_income_ratio: Decimal | None
    total_income: Decimal
    total_expenses: Decimal
    net_profit: Decimal
    note: str = (
        "Only profit margin and expense-to-income ratio are computed. "
        "Current ratio, quick ratio, and debt ratios require asset/liability data "
        "which is out of scope for this simplified system."
    )


class RecurringRow(BaseModel):
    category: str
    avg_amount: Decimal
    months_seen: list[str]
    entry_ids: list[UUID]


class RecurringReport(BaseModel):
    recurring: list[RecurringRow]
    note: str = (
        "Recurring detection uses simple pattern matching — same category + similar amount "
        "(within 5% tolerance) appearing in 2+ consecutive months. "
        "This is NOT ML-based prediction."
    )


class CategoryDuplicate(BaseModel):
    category_a: str
    category_b: str
    similarity_score: float


class CategoryConsistencyReport(BaseModel):
    possible_duplicates: list[CategoryDuplicate]


class YoYRow(BaseModel):
    category: str
    year_a_total: Decimal
    year_b_total: Decimal
    change_amount: Decimal
    change_percent: Decimal | None


class YoYReport(BaseModel):
    rows: list[YoYRow]
    year_a: int
    year_b: int


class DashboardReport(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_cash: Decimal
    entry_count: int
    recent_entries: list[EntryOut]
    income_by_category: list[CategoryBreakdown]
    expense_by_category: list[CategoryBreakdown]
    monthly_net: list[MonthlyNet]
