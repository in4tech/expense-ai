import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.services import chat_service

router = APIRouter()


async def get_db():
    async with SessionLocal() as session:
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]


class CreateConversationBody(BaseModel):
    title: str | None = Field(default=None, max_length=200)


class SendMessageBody(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)


def _conversation_summary_row(conversation) -> dict:
    updated = conversation.updated_at or conversation.created_at
    return {
        "id": str(conversation.id),
        "title": conversation.title or "New conversation",
        "updatedAt": updated.isoformat() if updated else "",
    }


def _message_row(message) -> dict:
    created = message.created_at
    return {
        "id": str(message.id),
        "role": message.role,
        "content": message.content,
        "createdAt": created.isoformat() if created else "",
    }


@router.get("")
async def list_conversations(db: DbSession):
    rows = await chat_service.list_conversations(db)
    return {"conversations": [_conversation_summary_row(c) for c in rows]}


@router.post("")
async def create_conversation_route(
    db: DbSession,
    body: CreateConversationBody = CreateConversationBody(),
):
    conversation = await chat_service.create_conversation(db, title=body.title)
    return _conversation_summary_row(conversation)


@router.get("/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    db: DbSession,
    limit: int = Query(default=20, ge=1, le=500),
):
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await chat_service.get_messages(db, conversation_id, limit=limit)
    return {"messages": [_message_row(m) for m in messages]}

@router.post("/{conversation_id}/assistant")
async def complete_assistant_reply(conversation_id: int, db: DbSession):
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    messages = await chat_service.get_messages(db, conversation_id)
    if not messages:
        raise HTTPException(status_code=400, detail="No messages in conversation")
    if messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Last message is not from the user")

    await db.refresh(conversation)
    transcript = (conversation.summary or "").strip()
    if not transcript:
        transcript = "\n".join(f"{m.role}: {m.content}" for m in messages)
    llm_messages = [
        {
            "role": "system",
            "content": f"Bạn là AI assistant thân thiện\n\nConversation summary:\n{transcript}",
        },
    ]

    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=llm_messages,
    )

    ai_reply = response.choices[0].message.content or ""
    await chat_service.create_message(
        db,
        conversation_id=conversation_id,
        role="assistant",
        content=ai_reply,
    )

    return {"reply": ai_reply}

@router.post("/{conversation_id}/chat-stream")
async def chat_stream(conversation_id: int, body: SendMessageBody, db: DbSession):
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    await chat_service.create_message(
        db,
        conversation_id=conversation_id,
        role="user",
        content=body.message,
    )
    await db.refresh(conversation)

    transcript = conversation.summary or ""
    llm_messages = [
        {
            "role": "system",
            "content": f"Bạn là AI assistant thân thiện\n\nConversation summary:\n{transcript}",
        },
    ]

    async def generate():
        full_response = ""

        client = AsyncOpenAI(api_key=api_key)
        stream = await client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=llm_messages,
            stream=True,
        )

        async for chunk in stream:
            if not chunk.choices:
                continue
            content = chunk.choices[0].delta.content
            if content:
                full_response += content
                yield content

        await chat_service.create_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=full_response,
        )
 
    return StreamingResponse(
        generate(),
        media_type="text/plain"
    )
