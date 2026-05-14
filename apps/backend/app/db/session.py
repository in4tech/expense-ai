from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL)
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

MODELS = "text-embedding-3-small"
CHAT_MODELS = "gpt-4.1-mini"

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with (SessionLocal() as session):
        yield session