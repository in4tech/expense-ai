from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/expense_ai"

engine = create_async_engine(DATABASE_URL)

SessionLocal = sessionmaker(engine, expire_on_commit=False)
