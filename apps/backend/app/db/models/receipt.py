from sqlalchemy import Column, Integer, String, Float

from app.db.base import Base

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    merchant = Column(String)
    total = Column(Float)
    category = Column(String)
    