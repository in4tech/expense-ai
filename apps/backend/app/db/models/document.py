from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.uuid_columns import uuid_fk, uuid_pk


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = uuid_pk()
    conversation_id = uuid_fk("conversations", nullable=False)

    content = Column(Text)
    page = Column(Integer)

    embedding = Column(Vector(1536))
    search_vector = Column(TSVECTOR)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
