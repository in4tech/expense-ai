from uuid import UUID

from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.db.models.conversation import Conversation
from app.db.models.document import DocumentChunk
from app.db.models.message import Message

_DEFAULT_TITLES = frozenset({"New Chat", "New conversation"})

async def get_conversation(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID,
) -> Conversation | None:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .where(Conversation.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def list_conversations(db: AsyncSession, user_id: UUID) -> list[Conversation]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc(), Conversation.id.desc())
    )
    return list(result.scalars().all())


async def create_conversation(
    db: AsyncSession,
    user_id: UUID,
    title: str | None = None,
) -> Conversation:
    conversation = Conversation(
        user_id=user_id,
        title=title or "New conversation",
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def get_messages(
    db: AsyncSession,
    conversation_id: UUID,
    *,
    limit: int | None = None,
) -> list[Message]:
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


async def get_messages_page(
    db: AsyncSession,
    conversation_id: UUID,
    *,
    limit: int = 20,
    before_id: UUID | None = None,
) -> tuple[list[Message], bool]:
    capped = min(max(limit, 1), 500)
    stmt = select(Message).where(Message.conversation_id == conversation_id)
    if before_id is not None:
        stmt = stmt.where(Message.id < before_id)
    stmt = (
        stmt.order_by(Message.created_at.desc(), Message.id.desc())
        # Fetch one extra row to detect whether more older messages exist.
        .limit(capped + 1)
    )
    result = await db.execute(stmt)
    rows = list(result.scalars().all())
    has_more = len(rows) > capped
    if has_more:
        rows = rows[:capped]
    rows.reverse()
    return rows, has_more


async def create_message(
    db: AsyncSession,
    conversation_id: UUID,
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

    await db.flush()

    await db.commit()
    await db.refresh(message)
    return message



async def search_similar_messages(
    db: AsyncSession,
    conversation_id: UUID,
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
    conversation_id: UUID,
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

async def hybrid_search_messages(
    db: AsyncSession,
    conversation_id: UUID,
    embedding,
    query,
    limit=5
):
    vector_messages = await search_similar_messages(db, conversation_id, embedding, limit)
    keyword_messages = await keyboard_search_messages(db, conversation_id, query, limit)
    return vector_messages + keyword_messages

async def delete_conversation(
    db: AsyncSession,
    conversation_id: UUID,
) -> None:
    await db.execute(delete(Message).where(Message.conversation_id == conversation_id))
    await db.execute(delete(DocumentChunk).where(DocumentChunk.conversation_id == conversation_id))
    await db.execute(delete(Conversation).where(Conversation.id == conversation_id))
    await db.commit()
