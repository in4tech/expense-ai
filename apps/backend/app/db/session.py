from typing import Annotated
from fastapi import Depends
from openai import AsyncOpenAI
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

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

DbSession = Annotated[AsyncSession, Depends(get_db)]

planner_llm = ChatOpenAI(model=CHAT_MODELS, temperature=0)
reasoning_llm = ChatOpenAI(model=CHAT_MODELS, temperature=0)
critic_llm = ChatOpenAI(model=CHAT_MODELS, temperature=0)