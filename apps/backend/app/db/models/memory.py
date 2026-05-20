from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Float, Text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIME_TIMEZONE

from app.db.base import Base
from app.db.uuid_columns import uuid_fk, uuid_pk


class Memory(Base):
    __tablename__ = "memories"

    id = uuid_pk()
    user_id = uuid_fk("users", nullable=False)
    embedding = Column(Vector(1536))
    search_vector = Column(TSVECTOR)
    importance_score = Column(Float, default=0.5)

    content = Column(Text, nullable=False)
    memory_type = Column(Text, nullable=False)

    created_at = Column(
        TIME_TIMEZONE,
        server_default=func.now(),
    )
