import json

from sqlalchemy.sql import func
from sqlalchemy import desc, select
from app.db.models.memory import Memory
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import client, CHAT_MODELS
from app.services.embedding_service import create_embedding

async def create_memory(
    db,
    user_id,
    memory
):
    memory_embedding = await create_embedding(memory['content'])
    memory = Memory(
        user_id=user_id,
        embedding=memory_embedding,
        content=memory["content"],
        memory_type=memory["type"],
        importance_score= memory["importance"]
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

    rows = result.scalars().all()
    return [
        {
            "content": row.content,
            "memory_type": row.memory_type,
            "importance": row.importance_score,
        }
        for row in rows
    ]

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
    rows = result.scalars().all()
    return [
        {
            "content": row.content,
            "memory_type": row.memory_type,
            "importance": row.importance_score,
        }
        for row in rows
    ]

async def extract_memory(message, assistant_response):
    response = await client.chat.completions.create(
        model=CHAT_MODELS,
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": """
                Extract long-term useful memories.

                Only extract:
                - user goals
                - preferences
                - personal projects
                - ongoing learning
                - important facts

                Return JSON:

                {
                    "memories": [
                        {
                        "type": "goal",
                        "content": "...",
                        "importance": 0.9
                        }
                    ]
                }
                """
            },
            {
                "role": "user",
                "content": f"""

                USER MESSAGE:

                {message}

                ASSISTANT RESPONSE:

                {assistant_response}

                """
            }
        ]
    )

    return json.loads(response.choices[0].message.content)

async def save_memories(
    db,
    user_id,
    memories
):
    for memory in memories:
        try:
            await create_memory(
                db=db,
                user_id=user_id,
                memory=memory
            )
        except Exception as e:
            print("Memory save error:", str(e))