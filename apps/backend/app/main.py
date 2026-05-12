from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.conversations.router import router as conversations_router

from app.db.base import Base
from app.db.models import Conversation, Message, Receipt, DocumentChunk  # noqa: F401 — register tables
from app.db.schema_patch import apply_schema_patches, ensure_pgvector_extension
from app.db.session import engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await ensure_pgvector_extension(conn)
        await conn.run_sync(Base.metadata.create_all)
        await apply_schema_patches(conn)

app.include_router(conversations_router, prefix="/conversations", tags=["conversations"])