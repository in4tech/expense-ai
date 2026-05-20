from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.db.uuid_columns import uuid_pk


class Room(Base):
    __tablename__ = "rooms"

    id = uuid_pk()

    kitchen = Column(Boolean, nullable=True)
    desk = Column(Boolean, nullable=True)
    bed = Column(Boolean, nullable=True)
    elevator = Column(Boolean, nullable=True)
    tivi = Column(Boolean, nullable=True)
    mattress = Column(Boolean, nullable=True)
    cooling_type = Column(String, nullable=True)
    pet = Column(Boolean, nullable=True)
    parking_space = Column(String, nullable=True)
    toilet = Column(String, nullable=True)
    time = Column(String, nullable=True)
    gatelock = Column(String, nullable=True)
    room_area = Column(String, nullable=True)
    bancony = Column(Boolean, nullable=True)
    fridge = Column(Boolean, nullable=True)
    washer = Column(Boolean, nullable=True)
    hotwater = Column(Boolean, nullable=True)
    air_conditioner = Column(Boolean, nullable=True)
    kitchent_sink = Column(Boolean, nullable=True)
    window = Column(Boolean, nullable=True)
    drying_yard = Column(String, nullable=True)
    wardrobe = Column(Boolean, nullable=True)
    floor = Column(String, nullable=True)
    skylight = Column(Boolean, nullable=True)
    attic = Column(Boolean, nullable=True)
    housings = relationship("Housing", back_populates="room")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
