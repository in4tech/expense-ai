
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func
from app.db.base import Base


class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer)
    content = Column(Text)
    embedding = Column(Vector(1536))

    memory_type = Column(String)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )