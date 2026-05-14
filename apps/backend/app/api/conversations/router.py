import json

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal, client, CHAT_MODELS
from app.services import chat_service, embedding_service, document_service
from app.services.memory_service import create_memory, extract_memory, hybrid_search_memories
from app.core.config import settings

from app.ai.tools import TOOLS
from app.ai.agent_tools import TOOLS_MAP

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

class ChatStreamBody(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    user_id: int = Field(default=1, ge=1)


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
async def create_conversation_route(db: DbSession, body: CreateConversationBody = CreateConversationBody()):
    conversation = await chat_service.create_conversation(db, title=body.title)
    return _conversation_summary_row(conversation)

@router.get("/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: int, db: DbSession, limit: int = Query(default=20, ge=1, le=500)):
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await chat_service.get_messages(db, conversation_id, limit=limit)
    return {"messages": [_message_row(m) for m in messages]}

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int, db: DbSession):
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

    response = await client.chat.completions.create(
        model=CHAT_MODELS,
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
async def chat_stream(
    conversation_id: int,
    body: ChatStreamBody,
    db: DbSession,
):
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_id = body.user_id
    user_text = body.message

    user_embedding = await embedding_service.create_embedding(user_text)
    await chat_service.create_message(
        db=db,
        conversation_id=conversation_id,
        role="user",
        content=user_text,
        embedding=user_embedding
    )

    memory_data = await extract_memory(user_text)
    if(memory_data.get("should_save")):
        memory_content = memory_data["memory"]
        memory_embedding = await embedding_service.create_embedding(memory_content)

        await create_memory(
            db=db,
            user_id=user_id,
            content=memory_content,
            embedding=memory_embedding,
            memory_type=memory_data["memory_type"]
        )
        
    relevant_memories = await hybrid_search_memories(
        db=db,
        user_id=user_id,
        embedding=user_embedding,
        query=user_text,
    )
    memory_context = "\n".join([f"- {memory.content}" for memory in relevant_memories])
    messages = [
        {
            "role": "system",
            "content": f"""
            You are an advanced AI assistant with access to external tools.

            Known user memories:

            {memory_context}
            

            Behavior rules:                
            - Use tools for factual, realtime, memory, or document-related questions.
            - Prefer knowledge-base retrieval before answering questions about uploaded files, memories, or previous conversations.
            - Use web search for current events, news, or realtime internet information.
            - Do not invent facts when relevant tools are available.
            - If retrieved context is insufficient, say so clearly.
            - Avoid unnecessary tool calls for simple conversational replies.

            Response style:
            - Be concise and accurate.
            - Focus on useful answers.
            """
        },
        {
           "role": "user",
            "content": user_text
        }
    ]

    async def generate():
        for iteration in range(MAX_INTERATION):
            yield sse_event({
                "type": "thinking",
                "iteration": iteration + 1
            })
            
            response = await client.chat.completions.create(
                model=CHAT_MODELS,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
            )

            message = response.choices[0].message
            
            # ====================================
            # TOOL CALL
            # ====================================
            if message.tool_calls:
                messages.append({
                    "role": "assistant",
                    "content": message.content,
                    "tool_calls": message.tool_calls
                })

                for tool_call in message.tool_calls:
                    function_name = tool_call.function.name

                    args = json.loads(tool_call.function.arguments)

                    yield sse_event({
                        "type": "tool_running",
                        "tool": function_name
                    })

                    # =============================
                    # EXECUTE TOOL
                    # =============================

                    if(function_name == "search_knowledge_base"):
                        result = await TOOLS_MAP[function_name](
                            db=db,
                            query=args['query'],
                            user_id=user_id,
                            conversation_id=conversation_id
                        )

                    elif(function_name == "search_web"):
                        result = await TOOLS_MAP[function_name](
                            query=args['query'],
                        )

                    else:
                        result = "Unknown tool"

                    yield sse_event({
                        "type": "tool_completed",
                        "tool": function_name
                    })

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": str(result)
                    })

            continue
            

        # ====================================
        # FINAL STREAMING
        # ====================================
        stream = await client.chat.completions.create(
            model=CHAT_MODELS,
            messages=messages,
            stream=True
        )
        
        full_response = ""
        async for chunk in stream:
            delta = chunk.choices[0].delta.content

            if delta:
                full_response += delta

                yield sse_event({
                    "type": "content",
                    "content": delta
                })
            
        ai_embedding = await embedding_service.create_embedding(full_response)
        await chat_service.create_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=full_response,
            embedding=ai_embedding
        )

        yield sse_event({
            "type": "done",
            "content": full_response
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