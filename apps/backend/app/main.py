from fastapi import FastAPI

from app.api.upload import router as upload_router

from app.db.base import Base
from app.db.session import engine

from app.db.models.receipt import Receipt

app = FastAPI()

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(upload_router)

@app.get("/")
async def root():
    return {
        "message": "Expense AI Backend"
    }