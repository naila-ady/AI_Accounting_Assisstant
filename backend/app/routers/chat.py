from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.chat import ChatMessageOut, ChatRequest, ChatResponse
from app.services.auth import get_current_user
from app.services.chat import get_chat_history, persist_messages, process_chat_message

router = APIRouter(tags=["chat"])


@router.post("/api/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await process_chat_message(db, body.message, body.history)
    await persist_messages(db, body.message, result.reply, result.tool_calls)
    return result


@router.get("/api/chat/history", response_model=list[ChatMessageOut])
async def history(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msgs = await get_chat_history(db, limit)
    return msgs
