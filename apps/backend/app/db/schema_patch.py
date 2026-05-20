from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

async def ensure_pgvector_extension(conn: AsyncConnection) -> None:
    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))
