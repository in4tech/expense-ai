import json

from sqlalchemy.sql import func
from sqlalchemy import desc, select
from app.db.models.memory import Memory
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import client, CHAT_MODELS

async def create_memory(
    db,
    user_id,
    content,
    embedding,
    memory_type="fact"
):
    memory = Memory(
        user_id=user_id,
        content=content,
        embedding=embedding,
        memory_type=memory_type
    )

    db.add(memory)

    await db.commit()
    await db.refresh(memory)

    return memory

async def hybrid_search_memories(
    db: AsyncSession,
    user_id,
    embedding,
    query,
    limit=5
):
    vector_memories = await search_memories(db, user_id, embedding, limit)
    keyword_memories = await keyword_search_memories(db, query, user_id, limit)

    return vector_memories + keyword_memories

async def search_memories(
    db: AsyncSession,
    user_id,
    embedding,
    limit=5
):
    result = await db.execute(
        select(Memory)
        .where(Memory.user_id == user_id)
        .order_by(Memory.embedding.cosine_distance(embedding))
        .limit(limit)
    )

    return result.scalars().all()

async def keyword_search_memories(
    db: AsyncSession,
    query,
    user_id,
    limit=5,
):
    tsq = func.plainto_tsquery(query)
    result = await db.execute(
        select(Memory)
        .where(Memory.user_id == user_id)
        .where(Memory.search_vector.op("@@")(tsq))
        .order_by(desc(func.ts_rank(Memory.search_vector, tsq)))
        .limit(limit)
    )
    return result.scalars().all()

async def extract_memory(message):
        response = client.chat.completions.create(
            model=CHAT_MODELS,
            response_format={
                "type": "json_object"
            },
            messages=[
                {
                    "role": "system",
                    "content": """
                    Extract useful long-term memory

                    ONLY save if:
                    - preference
                    - personal profile
                    - goals
                    - ongoing projects
                    - important facts

                    Return JSON:
                    {
                        "should_save": true,
                        "memory": "...",
                        "memory_type": "..."
                    }
                    """
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        )

        return json.loads(response.choices[0].message.content)