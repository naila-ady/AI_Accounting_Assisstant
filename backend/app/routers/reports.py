from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.reports import AuditReport, BalanceSheetReport, DashboardReport, PLReport
from app.services.auth import get_current_user
from app.services.reports import generate_balance_sheet, generate_dashboard, generate_pl, run_monthly_audit

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


@router.get("/dashboard", response_model=DashboardReport)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await generate_dashboard(db)


@router.post("/audit", response_model=AuditReport)
async def audit(
    month: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await run_monthly_audit(db, month)
