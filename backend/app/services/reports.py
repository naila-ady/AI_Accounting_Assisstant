from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_flag import AuditFlag
from app.models.entry import Entry
from app.schemas.reports import (
    AuditFlagOut, AuditReport, BalanceSheetReport,
    CategoryBreakdown, DashboardReport, MonthlyNet,
    PeriodInfo, PLReport, SeveritySummary,
)
from app.schemas.entry import EntryOut


async def generate_pl(db: AsyncSession, from_date: date | None, to_date: date | None) -> PLReport:
    today = date.today()
    if from_date is None:
        from_date = date(today.year, today.month, 1)
    if to_date is None:
        to_date = today

    query = select(
        Entry.entry_type,
        Entry.category,
        func.sum(Entry.amount).label("total"),
        func.count(Entry.id).label("cnt"),
    ).where(
        Entry.entry_date >= from_date,
        Entry.entry_date <= to_date,
    ).group_by(Entry.entry_type, Entry.category)

    result = await db.execute(query)
    rows = result.all()

    total_income = Decimal("0")
    total_expenses = Decimal("0")
    income_by_cat: dict[str, dict] = {}
    expense_by_cat: dict[str, dict] = {}

    for entry_type, category, total, cnt in rows:
        total_dec = Decimal(str(total))
        if entry_type == "income":
            total_income += total_dec
            income_by_cat[category] = {"total": total_dec, "count": cnt}
        else:
            total_expenses += total_dec
            expense_by_cat[category] = {"total": total_dec, "count": cnt}

    return PLReport(
        total_income=total_income,
        total_expenses=total_expenses,
        net_profit=total_income - total_expenses,
        income_by_category=[
            CategoryBreakdown(category=k, total=v["total"], count=v["count"])
            for k, v in income_by_cat.items()
        ],
        expense_by_category=[
            CategoryBreakdown(category=k, total=v["total"], count=v["count"])
            for k, v in expense_by_cat.items()
        ],
        period=PeriodInfo(start=from_date, end=to_date),
    )


async def generate_balance_sheet(db: AsyncSession) -> BalanceSheetReport:
    result = await db.execute(
        select(
            func.sum(Entry.amount).filter(Entry.entry_type == "income").label("total_income"),
            func.sum(Entry.amount).filter(Entry.entry_type == "expense").label("total_expenses"),
        )
    )
    row = result.one()
    total_income = Decimal(str(row.total_income or "0"))
    total_expenses = Decimal(str(row.total_expenses or "0"))

    return BalanceSheetReport(
        cash_position=total_income - total_expenses,
        total_income=total_income,
        total_expenses=total_expenses,
        as_of=date.today(),
    )


async def _entry_to_out(e: Entry) -> EntryOut:
    return EntryOut(
        id=e.id,
        entry_type=e.entry_type,
        category=e.category,
        amount=Decimal(str(e.amount)),
        description=e.description,
        entry_date=e.entry_date,
        payment_method=e.payment_method,
        source=e.source,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


async def generate_dashboard(db: AsyncSession) -> DashboardReport:
    today = date.today()

    # All-time totals
    all_time = await db.execute(
        select(
            func.sum(Entry.amount).filter(Entry.entry_type == "income").label("total_income"),
            func.sum(Entry.amount).filter(Entry.entry_type == "expense").label("total_expenses"),
            func.count(Entry.id).label("entry_count"),
        )
    )
    at_row = all_time.one()

    # Recent entries
    recent_result = await db.execute(
        select(Entry).order_by(Entry.created_at.desc()).limit(5)
    )
    recent_rows = list(recent_result.scalars().all())
    recent_entries = [await _entry_to_out(e) for e in recent_rows]

    # Income by category (all-time)
    inc_cat = await db.execute(
        select(Entry.category, func.sum(Entry.amount).label("total"), func.count(Entry.id).label("cnt"))
        .where(Entry.entry_type == "income")
        .group_by(Entry.category)
    )
    income_by_category = [
        CategoryBreakdown(category=r.category, total=Decimal(str(r.total)), count=r.cnt)
        for r in inc_cat.all()
    ]

    # Expense by category (all-time)
    exp_cat = await db.execute(
        select(Entry.category, func.sum(Entry.amount).label("total"), func.count(Entry.id).label("cnt"))
        .where(Entry.entry_type == "expense")
        .group_by(Entry.category)
    )
    expense_by_category = [
        CategoryBreakdown(category=r.category, total=Decimal(str(r.total)), count=r.cnt)
        for r in exp_cat.all()
    ]

    # Monthly net for last 12 months
    monthly_result = await db.execute(
        select(
            func.date_trunc("month", Entry.entry_date).label("month"),
            func.sum(Entry.amount).filter(Entry.entry_type == "income").label("income"),
            func.sum(Entry.amount).filter(Entry.entry_type == "expense").label("expense"),
        )
        .where(Entry.entry_date >= date(today.year - 1, today.month, 1))
        .group_by(func.date_trunc("month", Entry.entry_date))
        .order_by(func.date_trunc("month", Entry.entry_date))
    )
    monthly_net = [
        MonthlyNet(
            month=r.month.strftime("%Y-%m") if hasattr(r.month, "strftime") else str(r.month),
            income=Decimal(str(r.income or "0")),
            expense=Decimal(str(r.expense or "0")),
        )
        for r in monthly_result.all()
    ]

    return DashboardReport(
        total_income=Decimal(str(at_row.total_income or "0")),
        total_expenses=Decimal(str(at_row.total_expenses or "0")),
        net_cash=Decimal(str(at_row.total_income or "0")) - Decimal(str(at_row.total_expenses or "0")),
        entry_count=at_row.entry_count or 0,
        recent_entries=recent_entries,
        income_by_category=income_by_category,
        expense_by_category=expense_by_category,
        monthly_net=monthly_net,
    )


async def run_monthly_audit(db: AsyncSession, month: str | None) -> AuditReport:
    today = date.today()
    if month is None:
        month = today.strftime("%Y-%m")

    year_str, month_str = month.split("-")
    from_date = date(int(year_str), int(month_str), 1)
    if int(month_str) == 12:
        to_date = date(int(year_str) + 1, 1, 1)
    else:
        to_date = date(int(year_str), int(month_str) + 1, 1)

    result = await db.execute(
        select(Entry).where(Entry.entry_date >= from_date, Entry.entry_date < to_date)
    )
    entries_list = list(result.scalars().all())

    def _flag(entry: Entry, reason: str, severity: str) -> AuditFlagOut:
        return AuditFlagOut(
            id=uuid_lib.uuid4(),
            entry_id=entry.id,
            category=entry.category or "",
            flag_reason=reason,
            severity=severity,
            created_at=datetime.now(),
        )

    flags: list[AuditFlagOut] = []

    # Rule 1: Missing/empty category → high
    for e in entries_list:
        if not e.category or e.category.strip() == "":
            flags.append(_flag(e, "Missing or empty category", "high"))

    # Rule 2: Amount > 3x category average
    cat_entries: dict[str, list[Entry]] = defaultdict(list)
    for e in entries_list:
        cat_entries[e.category].append(e)
    for cat, cat_list in cat_entries.items():
        if len(cat_list) < 4:
            continue
        total = sum(Decimal(str(e.amount)) for e in cat_list)
        avg = total / len(cat_list)
        threshold = avg * Decimal("3")
        for e in cat_list:
            amt = Decimal(str(e.amount))
            if amt > threshold:
                if not any(f.entry_id == e.id for f in flags):
                    flags.append(_flag(e, f"Amount {amt} exceeds 3x category average ({avg:.2f})", "medium"))

    # Rule 3: Duplicate (same category + amount + entry_date)
    seen: dict[tuple, list[Entry]] = defaultdict(list)
    for e in entries_list:
        key = (e.category, str(e.amount), str(e.entry_date))
        seen[key].append(e)
    for key, dupes in seen.items():
        if len(dupes) > 1:
            for e in dupes:
                if not any(f.entry_id == e.id for f in flags):
                    flags.append(_flag(e, "Possible duplicate: same category, amount, and date", "low"))

    # Rule 4: Round-number large expense (> 50,000, ends in 000)
    for e in entries_list:
        if e.entry_type != "expense":
            continue
        amt = Decimal(str(e.amount))
        if amt > Decimal("50000") and amt % Decimal("1000") == Decimal("0"):
            if not any(f.entry_id == e.id for f in flags):
                flags.append(_flag(e, "Large round-number expense — verify", "low"))

    # Persist
    await db.execute(delete(AuditFlag).where(AuditFlag.period == month))
    for f in flags:
        db.add(AuditFlag(
            period=month,
            entry_id=f.entry_id,
            flag_reason=f.flag_reason,
            severity=f.severity,
        ))
    await db.flush()

    high = sum(1 for f in flags if f.severity == "high")
    medium = sum(1 for f in flags if f.severity == "medium")
    low = sum(1 for f in flags if f.severity == "low")

    return AuditReport(
        period=month,
        total_entries_checked=len(entries_list),
        flags=flags,
        summary=SeveritySummary(high=high, medium=medium, low=low),
    )
