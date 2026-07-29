from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entry import Entry
from app.schemas.entry import EntryCreate, EntryUpdate


async def create_entry(db: AsyncSession, data: EntryCreate) -> Entry:
    entry = Entry(**data.model_dump())
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


async def list_entries(
    db: AsyncSession,
    *,
    entry_type: str | None = None,
    category: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Entry], int]:
    query = select(Entry)
    count_query = select(func.count(Entry.id))

    if entry_type:
        query = query.where(Entry.entry_type == entry_type)
        count_query = count_query.where(Entry.entry_type == entry_type)
    if category:
        query = query.where(Entry.category == category)
        count_query = count_query.where(Entry.category == category)
    if from_date:
        query = query.where(Entry.entry_date >= from_date)
        count_query = count_query.where(Entry.entry_date >= from_date)
    if to_date:
        query = query.where(Entry.entry_date <= to_date)
        count_query = count_query.where(Entry.entry_date <= to_date)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    query = query.order_by(Entry.entry_date.desc(), Entry.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def get_entry(db: AsyncSession, entry_id: UUID) -> Entry | None:
    result = await db.execute(select(Entry).where(Entry.id == entry_id))
    return result.scalar_one_or_none()


async def update_entry(db: AsyncSession, entry_id: UUID, data: EntryUpdate) -> Entry | None:
    entry = await get_entry(db, entry_id)
    if entry is None:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry, key, value)
    await db.flush()
    await db.refresh(entry)
    return entry


async def delete_entry(db: AsyncSession, entry_id: UUID) -> bool:
    entry = await get_entry(db, entry_id)
    if entry is None:
        return False
    await db.delete(entry)
    await db.flush()
    return True


async def list_categories(db: AsyncSession) -> list[str]:
    result = await db.execute(select(Entry.category).distinct().order_by(Entry.category))
    return [row[0] for row in result.all()]
