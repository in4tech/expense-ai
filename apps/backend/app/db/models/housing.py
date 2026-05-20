from sqlalchemy import BigInteger, Boolean, Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.uuid_columns import uuid_fk, uuid_pk


class Housing(Base):
    __tablename__ = "housings"

    id = uuid_pk()

    electricity_unit = Column(String, nullable=True)
    water_unit = Column(String, nullable=True)
    otherfee = Column(Integer, nullable=True)
    parking_unit = Column(String, nullable=True)
    room_code = Column(String, nullable=True, index=True)
    room_id = uuid_fk("rooms", nullable=True, index=True)
    room = relationship("Room", back_populates="housings")

    price = Column(BigInteger, nullable=True)
    house_name = Column(String, nullable=True)
    is_allow_electric_car = Column(String, nullable=True)
    electricity_fee = Column(Integer, nullable=True)
    water_fee = Column(Integer, nullable=True)
    card_fee = Column(Integer, nullable=True)
    washing_machine_fee = Column(Integer, nullable=True)
    parking_fee = Column(Integer, nullable=True)
    garbage_fee = Column(Integer, nullable=True)
    card_unit = Column(String, nullable=True)
    garbage_unit= Column(String, nullable=True)
    has_wifi = Column(Boolean, nullable=True)
    address = Column(String, nullable=True)
    amenities = Column(JSONB, nullable=True)
    last_update = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
