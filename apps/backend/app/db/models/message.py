from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from pgvector.sqlalchemy import Vector

from app.db.base import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)

    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    meta = Column("metadata", JSON, nullable=True)

    embedding = Column(Vector(1536), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
