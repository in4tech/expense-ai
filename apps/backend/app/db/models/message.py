from sqlalchemy import JSON, Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.sql import func

from pgvector.sqlalchemy import Vector

from app.db.base import Base
from app.db.uuid_columns import uuid_fk, uuid_pk


class Message(Base):
    __tablename__ = "messages"

    id = uuid_pk()
    conversation_id = uuid_fk("conversations", nullable=False)

    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    meta = Column("metadata", JSON, nullable=True)

    embedding = Column(Vector(1536), nullable=True)
    search_vector = Column(TSVECTOR)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
