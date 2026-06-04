

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.uuid_columns import uuid_fk, uuid_pk


class HousingImages(Base):
    __tablename__ = "housing_images"

    id = uuid_pk()
    housing_id = uuid_fk("housings", nullable=True, index=True)

    image_url = Column(String, nullable=False)
    is_thumbnail = Column(Boolean, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())