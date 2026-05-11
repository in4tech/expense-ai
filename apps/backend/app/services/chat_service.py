from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.conversation import Conversation
from app.db.models.message import Message

_DEFAULT_TITLES = frozenset({"New Chat", "New conversation"})


async def get_conversation(db: AsyncSession, conversation_id: int) -> Conversation | None:
    return await db.get(Conversation, conversation_id)


async def list_conversations(db: AsyncSession) -> list[Conversation]:
    result = await db.execute(
        select(Conversation).order_by(Conversation.updated_at.desc(), Conversation.id.desc())
    )
    return list(result.scalars().all())


async def create_conversation(db: AsyncSession, title: str | None = None) -> Conversation:
    conversation = Conversation(title=title or "New conversation")
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def get_messages(db: AsyncSession, conversation_id: int) -> list[Message]:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    return list(result.scalars().all())


async def create_message(
    db: AsyncSession,
    conversation_id: int,
    role: str,
    content: str,
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    db.add(message)

    conversation = await db.get(Conversation, conversation_id)
    if conversation:
        now = datetime.now(timezone.utc)
        conversation.updated_at = now
        if role == "user":
            stripped = content.strip()
            if stripped and (not conversation.title or conversation.title in _DEFAULT_TITLES):
                conversation.title = stripped[:40]

    await db.commit()
    await db.refresh(message)
    return message
