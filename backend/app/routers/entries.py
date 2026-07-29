from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.entry import EntryCreate, EntryListResponse, EntryOut, EntryUpdate
from app.services.auth import get_current_user
from app.services.entries import create_entry, delete_entry, get_entry, list_categories, list_entries, update_entry

router = APIRouter(prefix="/api/entries", tags=["entries"])
categories_router = APIRouter(tags=["categories"])


@router.post("", response_model=EntryOut, status_code=status.HTTP_201_CREATED)
async def create(body: EntryCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await create_entry(db, body)


@router.get("", response_model=EntryListResponse)
async def list(
    entry_type: str | None = Query(None, pattern=r"^(expense|income)$"),
    category: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = await list_entries(
        db, entry_type=entry_type, category=category, from_date=from_date, to_date=to_date, page=page, page_size=page_size
    )
    return EntryListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{entry_id}", response_model=EntryOut)
async def get(entry_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = await get_entry(db, entry_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return entry


@router.patch("/{entry_id}", response_model=EntryOut)
async def update(entry_id: UUID, body: EntryUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = await update_entry(db, entry_id, body)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(entry_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    deleted = await delete_entry(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")


@categories_router.get("/api/categories")
async def categories(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    cats = await list_categories(db)
    return {"categories": cats}
