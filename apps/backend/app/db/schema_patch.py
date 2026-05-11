from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def apply_schema_patches(conn: AsyncConnection) -> None:
    await conn.execute(
        text(
            """
            ALTER TABLE conversations
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
            """
        )
    )
    await conn.execute(
        text(
            """
            UPDATE conversations
            SET updated_at = created_at
            WHERE updated_at IS NULL;
            """
        )
    )
    await conn.execute(
        text(
            """
            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'messages'
                  AND column_name = 'create_at'
              ) THEN
                ALTER TABLE messages RENAME COLUMN create_at TO created_at;
              END IF;
            END $$;
            """
        )
    )
