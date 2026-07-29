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


class DashboardReport(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_cash: Decimal
    entry_count: int
    recent_entries: list[EntryOut]
    income_by_category: list[CategoryBreakdown]
    expense_by_category: list[CategoryBreakdown]
    monthly_net: list[MonthlyNet]
