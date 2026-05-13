import json

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse

from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.services import chat_service, embedding_service, document_service
from app.services.memory_service import create_memory, extract_memory, search_memories
from app.config import settings

from app.ai.tools import TOOLS
from app.ai.agent_tools import get_recent_messages_tool, hybrid_search_documents, search_web_tool
from app.db.models import memory

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

# OLD: v1
# @router.post("/{conversation_id}/chat-stream")
# async def chat_stream(conversation_id: int, body: SendMessageBody, db: DbSession):
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    # Create embedding vectors
    user_embedding = await embedding_service.create_embedding(body.message)
    
    # Create messages database
    await chat_service.create_message(
        db,
        conversation_id=conversation_id,
        role="user",
        content=body.message,
        embedding=user_embedding
    )
    await db.refresh(conversation)

    # Load recent messages
    messages = await chat_service.get_messages(
        db,
        conversation_id=conversation_id,
        limit=20
    )

    # Revevant document memories
    vector_results = await document_service.search_document_chunks(
        db=db,
        embedding=user_embedding,
        conversation_id=conversation_id
    )

    # Revevant vector/sematic memories
    keyboard_results = await document_service.keyboard_search_documents(
        db=db,
        query=body.message,
        conversation_id=conversation_id
    )

    combined_chunks = {}
    for chunk in vector_results:
        combined_chunks[chunk.id] = chunk

    for row in keyboard_results:
        chunk = row[0]
        combined_chunks[chunk.id] = chunk

    final_chunks = list(combined_chunks.values())[:5]
    
    document_context = ""
    for chunk in final_chunks:
        document_context += f"""
        [Page {chunk.page}]

        {chunk.content}

        """

    # Relevant text memories
    relevant_memories = await chat_service.search_similar_messages(
        db,
        embedding=user_embedding,
        conversation_id=conversation_id
    )
    
    memory_text = ""
    for memory in relevant_memories:
        memory_text += (
            f"{memory.role}: "
            f"{memory.content}\n"
        )

    transcript = conversation.summary or ""
    memories = memory_text or ""
    system_prompt = f"""
    You are a friendly AI Assistant.
    
    Conversation summary:
    {transcript}
            
    Relevant Memories:
    {memories}

    When answering questions:
    - cite page number
    - format:
    (Source: Page X)

    Relevant Documents:
    {document_context}
    """
        
    llm_messages = [
        {
            "role": "system",
            "content": system_prompt,
        },
    ]

    for msg in messages:
        llm_messages.append({
            "role": msg.role,
            "content": msg.content
        })

    # Generate function - Streaming Response
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

        ai_embedding = await embedding_service.create_embedding(full_response)

        await chat_service.create_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=full_response,
            embedding=ai_embedding,
        )
 
    return StreamingResponse(
        generate(),
        media_type="text/plain"
    )

# NEW: v2
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

    relevant_memories = await search_memories(
        db=db,
        user_id=user_id,
        embedding=user_embedding,
        limit=5
    )

    memory_context = ""
    for memory in relevant_memories:
        memory_context += f"- {memory.content}\n"

    history = await chat_service.get_messages(
        db=db,
        conversation_id=conversation_id,
        limit=20
    )

    message_for_agent = [
        {
            "role": "system",
            "content": f""" 
            You are a friendly AI Assistant.

            Known user memories:

            {memory_context}

            You can:
            - Search documents
            - Read conversation history
            - Use tools when needed
            - Call tools multiple times

            Rules:
            - self-decide when to call tools
            - can call tools many times
            - only return final answer when enough information
            - if missing information, use tools
            - always think step by step
            """
        }
    ]

    for msg in history:
        message_for_agent.append({
            "role": msg.role,
            "content": msg.content
        })

    async def generate():
        full_response = ""

        for iteration in range(MAX_INTERATION):
            yield sse_event({
                "type": "thinking",
                "iteration": iteration + 1
            })

            client = AsyncOpenAI(api_key=api_key)
            response = await client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=message_for_agent,
                tools=TOOLS
            )

            assistant_message = response.choices[0].message

            message_for_agent.append({
                "role": "assistant",
                "content": assistant_message.content or "",
                "tool_calls": assistant_message.tool_calls
            })

            if not assistant_message.tool_calls:
                yield sse_event({
                    "type": "thinking",
                    "status": "final_answer"
                })

                break

            for tool_call in assistant_message.tool_calls:
                tool_name = tool_call.function.name

                arguments = json.loads(tool_call.function.arguments)

                yield sse_event({
                    "type": "tool",
                    "tool": tool_name,
                    "status": "running"
                })

                if(tool_name == "search_documents"):
                    result = await hybrid_search_documents(
                        db=db,
                        query=arguments["query"],
                        conversation_id=conversation_id
                    )

                elif(tool_name == "get_recent_messages"):
                    result = await get_recent_messages_tool(
                        db=db,
                        conversation_id=conversation_id,
                        limit=arguments.get("limit", 10)
                    )

                elif(tool_name == "search_web"):
                    result = await search_web_tool(
                        query=arguments["query"]
                    )

                else:
                    result = "Unknown tool"

                yield sse_event({
                    "type": "tool",
                    "tool": tool_name,
                    "status": "completed"
                })

                message_for_agent.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": tool_name,
                    "content": result
                })

        final_stream = await client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=message_for_agent,
            stream=True
        )

        async for chunk in final_stream:
            content = chunk.choices[0].delta.content

            if content:
                full_response += content

                yield sse_event({
                    "type": "content",
                    "content": content
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