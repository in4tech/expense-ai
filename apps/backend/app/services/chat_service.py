from openai import AsyncOpenAI
from datetime import datetime, timezone

from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.db.models.conversation import Conversation
from app.db.models.document import DocumentChunk
from app.db.models.message import Message

_DEFAULT_TITLES = frozenset({"New Chat", "New conversation"})

def format_conversation_summary(messages: list[Message]) -> str:
    return "\n".join(f"{m.role}: {m.content}" for m in messages)


async def rebuild_conversation_summary(db: AsyncSession, conversation_id: int) -> None:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    rows = list(result.scalars().all())
    text = format_conversation_summary(rows)
    conversation = await db.get(Conversation, conversation_id)
    if conversation:
        conversation.summary = text


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


async def get_messages(
    db: AsyncSession,
    conversation_id: int,
    *,
    limit: int | None = None,
) -> list[Message]:
    """``limit=None``: all messages asc. Otherwise last ``limit`` messages, asc order."""
    if limit is None:
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
        )
        return list(result.scalars().all())

    capped = min(max(limit, 1), 500)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(capped)
    )
    rows = list(result.scalars().all())
    rows.reverse()
    return rows


async def create_message(
    db: AsyncSession,
    conversation_id: int,
    role: str,
    content: str,
    embedding=None,
    metadata=None
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        embedding=embedding,
        meta=metadata
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

    await db.flush()
    await rebuild_conversation_summary(db, conversation_id)

    await db.commit()
    await db.refresh(message)
    return message



async def search_similar_messages(
    db: AsyncSession,
    conversation_id: int,
    embedding,
    limit: int = 5,
):
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .where(Message.embedding.is_not(None))
        .order_by(Message.embedding.cosine_distance(embedding))
        .limit(limit)
    )
    return result.scalars().all()

async def keyboard_search_messages(
    db: AsyncSession,
    conversation_id: int,
    query,
    limit: int = 5,
):
    tsq = func.plainto_tsquery(query)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .where(Message.search_vector.op("@@")(tsq))
        .order_by(desc(func.ts_rank(Message.search_vector, tsq)))
        .limit(limit)
    )
    return result.scalars().all()


async def delete_conversation(
    db: AsyncSession,
    conversation_id: int
) -> None:
    await db.execute(delete(Message).where(Message.conversation_id == conversation_id))
    await db.execute(delete(DocumentChunk).where(DocumentChunk.conversation_id == conversation_id))
    await db.execute(delete(Conversation).where(Conversation.id == conversation_id))
    await db.commit()
