from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class EntryCreate(BaseModel):
    entry_type: str = Field(pattern=r"^(expense|income)$")
    category: str = Field(min_length=1, max_length=100)
    amount: Decimal = Field(gt=0, decimal_places=2)
    description: str | None = None
    entry_date: date
    payment_method: str | None = None
    source: str = Field(default="manual", pattern=r"^(manual|ai)$")

    @field_validator("entry_date")
    @classmethod
    def not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("entry_date cannot be in the future")
        return v


class EntryUpdate(BaseModel):
    entry_type: str | None = Field(default=None, pattern=r"^(expense|income)$")
    category: str | None = Field(default=None, min_length=1, max_length=100)
    amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    description: str | None = None
    entry_date: date | None = None
    payment_method: str | None = None


class EntryOut(BaseModel):
    id: UUID
    entry_type: str
    category: str
    amount: Decimal
    description: str | None
    entry_date: date
    payment_method: str | None
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EntryListResponse(BaseModel):
    items: list[EntryOut]
    total: int
    page: int
    page_size: int
