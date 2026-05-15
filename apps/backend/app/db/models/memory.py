
from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIME_TIMEZONE
from app.db.base import Base


class Memory(Base):
    __tablename__ = "memories"

    id = Column(BigInteger, primary_key=True, index=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )
    embedding = Column(Vector(1536))
    search_vector = Column(TSVECTOR)
    importance_score = Column(Float, default=0.5)

    content = Column(Text, nullable=False)
    memory_type = Column(Text, nullable=False)

    created_at = Column(
        TIME_TIMEZONE,
        server_default=func.now()
    )