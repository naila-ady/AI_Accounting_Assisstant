from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    history: list | None = None


class ChatResponse(BaseModel):
    reply: str
    tool_calls: list[dict] | None = None


class ChatMessageOut(BaseModel):
    id: UUID
    role: str
    content: str
    tool_calls: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
