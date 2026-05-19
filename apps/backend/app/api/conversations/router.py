import asyncio
import json
import re

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from app.db.session import DbSession, client, CHAT_MODELS
from app.services import chat_service, embedding_service, document_service
from app.services.memory_service import persist_turn_memories, search_memories
from app.core.config import settings

from app.agents.graph.workflow import app

router = APIRouter()

def sse_event(data):
    return (
        f"data: "
        f"{json.dumps(data)}\n\n"
    )


def _format_context_docs(docs) -> str:
    if not docs:
        return "(none)"
    parts: list[str] = []
    for doc in docs:
        if isinstance(doc, dict):
            label = str(doc.get("type") or "context")
            body = (doc.get("content") or "").strip()
            if body:
                parts.append(f"[{label}]\n{body}")
        else:
            text = str(doc).strip()
            if text:
                parts.append(text)
    return "\n\n".join(parts) if parts else "(none)"


def _format_tool_results(results) -> str:
    if not results:
        return "(none)"
    parts: list[str] = []
    for entry in results:
        if not isinstance(entry, dict):
            parts.append(str(entry))
            continue
        tool = entry.get("tool", "tool")
        body = entry.get("result", "")
        parts.append(f"[{tool}]\n{body}")
    return "\n\n".join(parts) if parts else "(none)"


def _format_scratchpad(scratchpad) -> str:
    if not scratchpad:
        return "(none)"
    if isinstance(scratchpad, list):
        return "\n".join(
            item if isinstance(item, str) else str(item) for item in scratchpad
        ).strip() or "(none)"
    return str(scratchpad)

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
async def get_conversation_messages(
    conversation_id: int,
    db: DbSession,
    limit: int = Query(default=20, ge=1, le=500),
    before_id: int | None = Query(default=None, ge=1),
):
    conversation = await chat_service.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages, has_more = await chat_service.get_messages_page(
        db,
        conversation_id,
        limit=limit,
        before_id=before_id,
    )
    return {
        "messages": [_message_row(m) for m in messages],
        "hasMore": has_more,
    }

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
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured"
        )

    conversation = await chat_service.get_conversation(
        db,
        conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    user_id = body.user_id
    user_text = body.message
    user_embedding = await embedding_service.create_embedding(
        user_text
    )

    await chat_service.create_message(
        db=db,
        conversation_id=conversation_id,
        role="user",
        content=user_text,
        embedding=user_embedding
    )

    relevant_memories = await search_memories(
        db=db,
        user_id=user_id,
        embedding=user_embedding,
    )

    memory_context = "\n".join([f"""
        Memory Type:
        {memory["memory_type"]}

        Content:
        {memory["content"]}

        Importance:
        {memory["importance"]}
        """
        for memory in relevant_memories
    ])

    initial_state = {
        "db": db,
        "user_id": user_id,
        "user_input": user_text,
        "memory_context": memory_context,
        "conversation_id": conversation_id,
        "retrieval_docs": [],
        "rerank_docs": [],
        "tool_results": [],
        "scratchpad": [],
        "reflection": None,
        "planner_output": None,
        "iteration_count": 0,
    }

    async def generate():
        yield sse_event({"type": "start"})
        graph_result = await app.ainvoke(initial_state)

        yield sse_event({"type": "graph_done"})

        rerank_docs = graph_result.get("rerank_docs") or []
        has_pdf_context = any(
            isinstance(d, dict) and d.get("type") == "document" and (d.get("content") or "").strip()
            for d in rerank_docs
        )

        system_prompt = f"""
            You are a helpful AI assistant.

            Answer the user's question using the Retrieved context below. The
            context may contain:
              - [document] excerpts from PDF files the user uploaded in this
                conversation — treat these as the primary source when the user
                asks about an uploaded file.
              - [memory] long-term memories of the user.
              - [message] recent messages from this conversation.

            Rules:
            - Ground your answer in the Retrieved context whenever it is
              relevant. Quote facts (names, numbers, sections) from the
              [document] excerpts when answering questions about a PDF.
            - If the Retrieved context does not contain the answer, say so
              explicitly instead of guessing.

            Relevant memory:
            {memory_context}
            """

        final_prompt = f"""
            User question:
            {user_text}

            Retrieved context:
            {_format_context_docs(rerank_docs)}

            Tool results:
            {_format_tool_results(graph_result.get("tool_results"))}

            Reasoning draft:
            {_format_scratchpad(graph_result.get("scratchpad"))}

            Reflection:
            {graph_result.get("reflection") or "(none)"}

            {"Note: the user is asking about content from an uploaded PDF — prioritise the [document] excerpts above." if has_pdf_context else ""}
            """

        llm = ChatOpenAI(
            api_key=api_key,
            model="gpt-4o-mini",
            temperature=0.7,
            streaming=True,
        )

        final_response = ""
        buffer = ""

        async for chunk in llm.astream([
            SystemMessage(content=system_prompt),
            HumanMessage(content=final_prompt),
        ]):
            content = chunk.content or ""
            if not content:
                continue

            final_response += content
            buffer += content

            should_flush = (
                len(buffer) >= 40
                or re.search(r"[.!?]\s$", buffer)
            )

            if should_flush:
                last_break = max(
                    buffer.rfind(" "),
                    buffer.rfind("\n")
                )

                if last_break != -1:
                    send_text = buffer[:last_break + 1]
                    buffer = buffer[last_break + 1:]

                    yield sse_event({
                        "type": "content",
                        "content": send_text
                    })

            await asyncio.sleep(0)

        if buffer:
            yield sse_event({
                "type": "content",
                "content": buffer
            })

        if final_response:
            ai_embedding = await embedding_service.create_embedding(final_response)
            await chat_service.create_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=final_response,
                embedding=ai_embedding,
            )
            await persist_turn_memories(
                db=db,
                user_id=user_id,
                user_message=user_text,
                assistant_response=final_response,
            )

        yield sse_event({
            "type": "done",
            "content": final_response,
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )

@router.post("/{conversation_id}/upload-pdf")
async def upload_pdf(
    conversation_id: int,
    db: DbSession,
    file: UploadFile = File(...),
    message: str = Form(default=""),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files allowed"
        )

    pages = document_service.extract_pdf_text(file.file)
    if not pages:
        raise HTTPException(
            status_code=400,
            detail="PDF contains no text"
        )

    user_message = (message or "").strip()

    try:
        await chat_service.create_message(
            db=db,
            conversation_id=conversation_id,
            role="user",
            content=user_message or f"{file.filename}",
            metadata={
                "type": "pdf",
                "filename": file.filename,
                "message": user_message or None,
            },
        )

        full_text = "\n".join(page["text"] for page in pages)
        pdf_summary = await document_service.summarize_pdf(
            full_text,
            user_message=user_message or None,
        )

        total_chunks = 0
        for page_data in pages:
            chunks = document_service.chunk_page_text(
                text=page_data["text"],
                page=page_data["page"],
            )

            for chunk in chunks:
                embedding = await embedding_service.create_embedding(chunk["content"])
                await document_service.create_document_chunk(
                    db=db,
                    conversation_id=conversation_id,
                    content=chunk["content"],
                    embedding=embedding,
                    page=chunk["page"],
                )
                total_chunks += 1

        await chat_service.create_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=f"{pdf_summary}",
            metadata={
                "type": "pdf_summary",
                "filename": file.filename,
            },
        )

        return {
            "message": "PDF uploaded successfully",
            "summary": pdf_summary,
            "chunks": total_chunks,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )