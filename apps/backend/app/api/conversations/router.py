import json

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse

from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.services import chat_service, embedding_service, document_service
from app.services.memory_service import create_memory, extract_memory
from app.core.config import settings

from app.services.streaming_agent_service import streaming_agent

router = APIRouter()
MAX_INTERATION = 5

def sse_event(data):
    return (
        f"data: "
        f"{json.dumps(data)}\n\n"
    )

async def get_db():
    async with SessionLocal() as session:
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]


class CreateConversationBody(BaseModel):
    title: str | None = Field(default=None, max_length=200)

class SendMessageBody(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)

class ChatRequest(BaseModel):
    user_id: int
    conversation_id: int
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
        "metadata": message.meta,
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

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: DbSession
):
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await chat_service.delete_conversation(
        db=db,
        conversation_id=conversation_id
    )

    return {
        "message": "Conversation deleted successfully"
    }

@router.post("/{conversation_id}/assistant")
async def complete_assistant_reply(conversation_id: int, db: DbSession):
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    api_key = settings.OPENAI_API_KEY
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

@router.post("/chat-stream")
async def chat_stream(request: ChatRequest, db: DbSession):
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    user_id, conversation_id, message = request

    user_embedding = await embedding_service.create_embedding(message)
    await chat_service.create_message(
        db=db,
        conversation_id=conversation_id,
        role="user",
        content=message,
        embedding=user_embedding
    )

    memory_data = await extract_memory(message)
    if(memory_data.get("should_save")):
        memory_content = memory_data["memory"]
        memory_embedding = embedding_service.create_embedding(memory_content)

        await create_memory(
            db=db,
            user_id=user_id,
            content=memory_content,
            embedding=memory_embedding,
            memory_type=memory_data["memory_type"]
        )

    async def generate():
        full_response = ""

        async for chunk in streaming_agent(
            db=db,
            user_message=message,
            user_id=user_id,
            conversation_id=conversation_id,
            send_event=sse_event
        ):
            if isinstance(chunk, str):
                full_response += chunk
            else:
                yield chunk
        
        print(f"Response: {full_response}")
        ai_embedding = await embedding_service.create_embedding(full_response)

        await chat_service.create_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=full_response,
            embedding=ai_embedding
        )

        yield sse_event({
            "type": "done"
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )

@router.post("/{conversation_id}/upload-pdf")
async def upload_pdf(conversation_id: int, db: DbSession, file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files allowed"
        )
    
    try:
        await chat_service.create_message(
            db=db,
            conversation_id=conversation_id,
            role="user",
            content=f"{file.filename}",
            metadata={
                "type": "pdf",
                "filename": file.filename
            }
        )
        
        pages = document_service.extract_pdf_text(file.file)
        if not pages:
            raise HTTPException(
                status_code=400,
                detail="PDF contains no text"
            )

        full_text = ""
        for page_data in pages:
            full_text += (
                page_data["text"] + "\n"
            )

        pdf_summary = await document_service.summarize_pdf(full_text)

        total_chunks = 0
        for page_data in pages:
            page_number = page_data["page"]
            text = page_data["text"]

            chunks = document_service.chunk_page_text(
                text=text,
                page=page_number
            )

            for chunk in chunks:
                embedding = await embedding_service.create_embedding(
                    chunk["content"]
                )

                await document_service.create_document_chunk(
                    db=db,
                    conversation_id=conversation_id,
                    content=chunk["content"],
                    embedding=embedding,
                    page=chunk["page"]
                )

            total_chunks += 1

        await chat_service.create_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=(f"{pdf_summary}"),
            metadata={
                "type": "pdf_summary",
                "filename": file.filename
            }
        )

        return {
            "message": "PDF uploaded successfully",
            "summary": pdf_summary,
            "chunks": total_chunks,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )