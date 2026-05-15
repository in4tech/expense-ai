from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def ensure_pgvector_extension(conn: AsyncConnection) -> None:
    """Required before create_all when models use the vector type."""
    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))


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
            ALTER TABLE messages
            ADD COLUMN IF NOT EXISTS embedding vector(1536);
            """
        )
    )
    await conn.execute(
        text(
            """
            ALTER TABLE messages
            ADD COLUMN IF NOT EXISTS metadata JSONB;
            """
        )
    )
    await conn.execute(
        text(
            """
            ALTER TABLE messages
            ADD COLUMN IF NOT EXISTS search_vector tsvector;
            """
        )
    )
    await conn.execute(
        text(
            """
            UPDATE messages
            SET search_vector = to_tsvector('simple', COALESCE(content, ''))
            WHERE search_vector IS NULL;
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_messages_search_vector
            ON messages
            USING GIN (search_vector);
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE OR REPLACE FUNCTION messages_set_search_vector()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.search_vector := to_tsvector('simple', COALESCE(NEW.content, ''));
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            """
        )
    )
    await conn.execute(
        text(
            """
            DROP TRIGGER IF EXISTS messages_search_vector_tr ON messages;
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE TRIGGER messages_search_vector_tr
            BEFORE INSERT OR UPDATE OF content ON messages
            FOR EACH ROW
            EXECUTE FUNCTION messages_set_search_vector();
            """
        )
    )
    await conn.execute(
        text(
            """
            ALTER TABLE document_chunks
            ADD COLUMN IF NOT EXISTS page INTEGER;
            """
        )
    )
    await conn.execute(
        text(
            """
            ALTER TABLE document_chunks
            ADD COLUMN IF NOT EXISTS search_vector tsvector;
            """
        )
    )
    await conn.execute(
        text(
            """
            UPDATE document_chunks
            SET search_vector = to_tsvector('simple', COALESCE(content, ''))
            WHERE search_vector IS NULL;
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_document_chunks_search_vector
            ON document_chunks
            USING GIN (search_vector);
            """
        )
    )
    await conn.execute(
        text(
            """
            ALTER TABLE memories
            ADD COLUMN IF NOT EXISTS search_vector tsvector;
            """
        )
    )
    await conn.execute(
        text(
            """
            UPDATE memories
            SET search_vector = to_tsvector('simple', COALESCE(content, ''))
            WHERE search_vector IS NULL;
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_memories_search_vector
            ON memories
            USING GIN (search_vector);
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE OR REPLACE FUNCTION memories_set_search_vector()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.search_vector := to_tsvector('simple', COALESCE(NEW.content, ''));
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            """
        )
    )
    await conn.execute(
        text(
            """
            DROP TRIGGER IF EXISTS memories_search_vector_tr ON memories;
            """
        )
    )
    await conn.execute(
        text(
            """
            CREATE TRIGGER memories_search_vector_tr
            BEFORE INSERT OR UPDATE OF content ON memories
            FOR EACH ROW
            EXECUTE FUNCTION memories_set_search_vector();
            """
        )
    )
    await conn.execute(
        text(
            """
            ALTER TABLE memories
            ADD COLUMN IF NOT EXISTS importance_score DOUBLE PRECISION;
            """
        )
    )
    await conn.execute(
        text(
            """
            UPDATE memories
            SET importance_score = 0.5
            WHERE importance_score IS NULL;
            """
        )
    )
    await conn.execute(
        text(
            """
            INSERT INTO users (email, display_name, is_active)
            VALUES ('dev@local.test', 'Dev User', true)
            ON CONFLICT (email) DO NOTHING;
            """
        )
    )
