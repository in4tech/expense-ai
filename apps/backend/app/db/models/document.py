

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text

from sqlalchemy.sql import func
from app.db.base import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id"),
        nullable=False,
    )

    content = Column(Text)
    embedding = Column(Vector(1536))
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
