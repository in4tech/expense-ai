import json

from openai import OpenAI
from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db.models.memory import Memory

client = OpenAI(
    api_key=settings.OPENAI_API_KEY
)


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


async def extract_memory(message):
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            response_format={
                "type": "json_object"
            },
            messages=[
                {
                    "role": "system",
                    "content": f"""
                    Extract useful long-term memory

                    ONLY save if:
                    - preference
                    - peronal profile
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