import uuid as uuid_lib
from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import delete, func, literal_column, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_flag import AuditFlag
from app.models.entry import Entry
from app.schemas.reports import (
    AuditFlagOut, AuditReport, BalanceSheetReport,
    CashFlowReport, CategoryBreakdown, CategoryConsistencyReport,
    CategoryDuplicate, DashboardReport, MonthlyNet,
    PeriodInfo, PLReport, RatioReport, RecurringReport, RecurringRow,
    SeveritySummary, TrialBalanceReport, TrialBalanceRow, YoYReport, YoYRow,
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


async def generate_trial_balance(
    db: AsyncSession, from_date: date | None, to_date: date | None
) -> TrialBalanceReport:
    today = date.today()
    if from_date is None:
        from_date = date(today.year, today.month, 1)
    if to_date is None:
        to_date = today

    query = select(
        Entry.category,
        Entry.entry_type,
        func.sum(Entry.amount).label("total"),
    ).where(
        Entry.entry_date >= from_date,
        Entry.entry_date <= to_date,
    ).group_by(Entry.category, Entry.entry_type).order_by(Entry.category)

    result = await db.execute(query)
    rows = result.all()

    cat_map: dict[str, dict] = {}
    for category, entry_type, total in rows:
        total_dec = Decimal(str(total))
        if category not in cat_map:
            cat_map[category] = {"debit": Decimal("0"), "credit": Decimal("0")}
        if entry_type == "expense":
            cat_map[category]["debit"] += total_dec
        else:
            cat_map[category]["credit"] += total_dec

    trial_rows = [
        TrialBalanceRow(category=cat, debit=v["debit"], credit=v["credit"])
        for cat, v in sorted(cat_map.items())
    ]
    total_debit = sum(r.debit for r in trial_rows)
    total_credit = sum(r.credit for r in trial_rows)

    return TrialBalanceReport(
        rows=trial_rows,
        total_debit=total_debit,
        total_credit=total_credit,
        balanced=total_debit == total_credit,
    )


async def generate_cash_flow(
    db: AsyncSession, from_date: date | None, to_date: date | None
) -> CashFlowReport:
    today = date.today()
    if from_date is None:
        from_date = date(today.year, today.month, 1)
    if to_date is None:
        to_date = today

    result = await db.execute(
        select(
            func.sum(Entry.amount).filter(Entry.entry_type == "income").label("cash_in"),
            func.sum(Entry.amount).filter(Entry.entry_type == "expense").label("cash_out"),
        ).where(
            Entry.entry_date >= from_date,
            Entry.entry_date <= to_date,
        )
    )
    row = result.one()
    cash_in = Decimal(str(row.cash_in or "0"))
    cash_out = Decimal(str(row.cash_out or "0"))

    return CashFlowReport(
        period=PeriodInfo(start=from_date, end=to_date),
        cash_in=cash_in,
        cash_out=cash_out,
        net_cash_flow=cash_in - cash_out,
    )


async def generate_ratios(
    db: AsyncSession, from_date: date | None, to_date: date | None
) -> RatioReport:
    today = date.today()
    if from_date is None:
        from_date = date(today.year, today.month, 1)
    if to_date is None:
        to_date = today

    result = await db.execute(
        select(
            func.sum(Entry.amount).filter(Entry.entry_type == "income").label("total_income"),
            func.sum(Entry.amount).filter(Entry.entry_type == "expense").label("total_expenses"),
        ).where(
            Entry.entry_date >= from_date,
            Entry.entry_date <= to_date,
        )
    )
    row = result.one()
    total_income = Decimal(str(row.total_income or "0"))
    total_expenses = Decimal(str(row.total_expenses or "0"))
    net_profit = total_income - total_expenses

    profit_margin = None
    expense_to_income_ratio = None
    if total_income > 0:
        profit_margin = (net_profit / total_income) * Decimal("100")
        expense_to_income_ratio = total_expenses / total_income

    return RatioReport(
        period=PeriodInfo(start=from_date, end=to_date),
        profit_margin=profit_margin,
        expense_to_income_ratio=expense_to_income_ratio,
        total_income=total_income,
        total_expenses=total_expenses,
        net_profit=net_profit,
    )


async def detect_recurring(db: AsyncSession, months: int = 3) -> RecurringReport:
    today = date.today()
    from_date = date(today.year, today.month - months + 1, 1) if today.month >= months else date(today.year - 1, today.month + 12 - months + 1, 1)
    if from_date.day > 28:
        from_date = from_date.replace(day=1)

    result = await db.execute(
        select(
            Entry.category,
            func.date_trunc(literal_column("'month'"), Entry.entry_date).label("month"),
            func.avg(Entry.amount).label("avg_amt"),
            func.array_agg(Entry.id).label("ids"),
        ).where(
            Entry.entry_date >= from_date,
            Entry.entry_date <= today,
        ).group_by(Entry.category, func.date_trunc(literal_column("'month'"), Entry.entry_date))
        .order_by(Entry.category, func.date_trunc(literal_column("'month'"), Entry.entry_date))
    )
    rows = result.all()

    cat_months: dict[str, list[dict]] = {}
    for category, month_val, avg_amt, ids in rows:
        cat = category or "uncategorized"
        if cat not in cat_months:
            cat_months[cat] = []
        cat_months[cat].append({
            "month": month_val.strftime("%Y-%m") if hasattr(month_val, "strftime") else str(month_val),
            "avg_amt": Decimal(str(avg_amt or "0")),
            "ids": [uuid_lib.UUID(str(i)) for i in ids] if ids else [],
        })

    recurring_rows = []
    for cat, months_list in cat_months.items():
        if len(months_list) < 2:
            continue
        # Check consecutive months with similar amounts (within 5% tolerance)
        for i in range(len(months_list) - 1):
            if _amounts_similar(months_list[i]["avg_amt"], months_list[i + 1]["avg_amt"]):
                # Check if months are consecutive
                m1 = months_list[i]["month"]
                m2 = months_list[i + 1]["month"]
                if _months_consecutive(m1, m2):
                    all_ids = list(set(months_list[i]["ids"] + months_list[i + 1]["ids"]))
                    avg = (months_list[i]["avg_amt"] + months_list[i + 1]["avg_amt"]) / Decimal("2")
                    recurring_rows.append(RecurringRow(
                        category=cat,
                        avg_amount=avg,
                        months_seen=[m1, m2],
                        entry_ids=all_ids,
                    ))

    return RecurringReport(recurring=recurring_rows)


def _amounts_similar(a: Decimal, b: Decimal, tolerance: Decimal = Decimal("0.05")) -> bool:
    if a == 0 and b == 0:
        return True
    if a == 0 or b == 0:
        return False
    ratio = abs(a - b) / max(a, b)
    return ratio <= tolerance


def _months_consecutive(m1: str, m2: str) -> bool:
    y1, m1n = int(m1.split("-")[0]), int(m1.split("-")[1])
    y2, m2n = int(m2.split("-")[0]), int(m2.split("-")[1])
    total1 = y1 * 12 + m1n
    total2 = y2 * 12 + m2n
    return abs(total1 - total2) == 1


async def check_category_consistency(db: AsyncSession) -> CategoryConsistencyReport:
    import difflib

    result = await db.execute(
        select(Entry.category).distinct().where(Entry.category.isnot(None), Entry.category != "")
    )
    categories = sorted(set(r[0] for r in result.all()))

    duplicates = []
    seen_pairs = set()
    for i in range(len(categories)):
        for j in range(i + 1, len(categories)):
            a, b = categories[i], categories[j]
            # Normalize for comparison
            a_lower = a.lower().strip()
            b_lower = b.lower().strip()
            if a_lower == b_lower:
                score = 1.0
            else:
                score = difflib.SequenceMatcher(None, a_lower, b_lower).ratio()

            if score > 0.85:
                pair_key = tuple(sorted([a, b]))
                if pair_key not in seen_pairs:
                    seen_pairs.add(pair_key)
                    duplicates.append(CategoryDuplicate(
                        category_a=a,
                        category_b=b,
                        similarity_score=round(score, 4),
                    ))

    return CategoryConsistencyReport(possible_duplicates=duplicates)


async def generate_yoy(
    db: AsyncSession, category: str | None, year_a: int, year_b: int
) -> YoYReport:
    query = select(
        Entry.category,
        func.sum(Entry.amount).filter(func.extract("year", Entry.entry_date) == year_a).label("year_a_total"),
        func.sum(Entry.amount).filter(func.extract("year", Entry.entry_date) == year_b).label("year_b_total"),
    )

    if category:
        query = query.where(Entry.category == category)

    query = query.group_by(Entry.category).order_by(Entry.category)

    result = await db.execute(query)
    rows = result.all()

    yoy_rows = []
    for cat, ya, yb in rows:
        ya_dec = Decimal(str(ya or "0"))
        yb_dec = Decimal(str(yb or "0"))
        change = yb_dec - ya_dec
        change_pct = None
        if ya_dec > 0:
            change_pct = (change / ya_dec) * Decimal("100")
        yoy_rows.append(YoYRow(
            category=cat,
            year_a_total=ya_dec,
            year_b_total=yb_dec,
            change_amount=change,
            change_percent=change_pct,
        ))

    return YoYReport(rows=yoy_rows, year_a=year_a, year_b=year_b)


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
            func.date_trunc(literal_column("'month'"), Entry.entry_date).label("month"),
            func.sum(Entry.amount).filter(Entry.entry_type == "income").label("income"),
            func.sum(Entry.amount).filter(Entry.entry_type == "expense").label("expense"),
        )
        .where(Entry.entry_date >= date(today.year - 1, today.month, 1))
        .group_by(func.date_trunc(literal_column("'month'"), Entry.entry_date))
        .order_by(func.date_trunc(literal_column("'month'"), Entry.entry_date))
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
