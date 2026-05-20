from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.uuid_columns import uuid_fk, uuid_pk


class Conversation(Base):
    __tablename__ = "conversations"

    id = uuid_pk()
    user_id = uuid_fk("users", nullable=False, index=True)
    title = Column(String, nullable=True)
    summary = Column(Text, default="")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
