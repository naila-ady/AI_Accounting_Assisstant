from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.reports import (
    AuditReport, BalanceSheetReport, CashFlowReport, CategoryConsistencyReport,
    DashboardReport, PLReport, RatioReport, RecurringReport, TrialBalanceReport, YoYReport,
)
from app.services.auth import get_current_user
from app.services.reports import (
    check_category_consistency, detect_recurring, generate_balance_sheet,
    generate_cash_flow, generate_dashboard, generate_pl, generate_ratios,
    generate_trial_balance, generate_yoy, run_monthly_audit,
)

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/pl", response_model=PLReport)
async def pl(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await generate_pl(db, start_date, end_date)


@router.get("/balance-sheet", response_model=BalanceSheetReport)
async def balance_sheet(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await generate_balance_sheet(db)


@router.get("/trial-balance", response_model=TrialBalanceReport)
async def trial_balance(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await generate_trial_balance(db, start_date, end_date)


@router.get("/dashboard", response_model=DashboardReport)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await generate_dashboard(db)


@router.get("/cash-flow", response_model=CashFlowReport)
async def cash_flow(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await generate_cash_flow(db, start_date, end_date)


@router.get("/ratios", response_model=RatioReport)
async def ratios(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await generate_ratios(db, start_date, end_date)


@router.get("/recurring", response_model=RecurringReport)
async def recurring(
    months: int = Query(3, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await detect_recurring(db, months)


@router.get("/category-consistency", response_model=CategoryConsistencyReport)
async def category_consistency(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await check_category_consistency(db)


@router.get("/yoy", response_model=YoYReport)
async def yoy(
    category: str | None = Query(None),
    year_a: int = Query(..., ge=2000, le=2100),
    year_b: int = Query(..., ge=2000, le=2100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await generate_yoy(db, category, year_a, year_b)


@router.post("/audit", response_model=AuditReport)
async def audit(
    month: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await run_monthly_audit(db, month)
