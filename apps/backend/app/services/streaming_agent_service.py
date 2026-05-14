
import json

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.ai.tools import TOOLS
from apps.backend.app.ai.agent_tools import TOOLS_MAP


async def streaming_agent(
    db: AsyncSession,
    user_message,
    user_id,
    conversation_id,
    send_event
):
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    messages = [
        {
            "role": "system",
            "content": """
            You are an advanced AI assistant with access to external tools.

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
            "content": user_message
        }
    ]

    for iteration in range(5):
        yield send_event({
            "type": "thinking",
            "iteration": iteration + 1
        })
        
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=messages,
            tools=TOOLS,
        )

        message = response.choices[0].message
        if message.tool_calls:
            messages.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": message.tool_calls
            })

            for tool_call in message.tool_calls:
                function_name = tool_call.function.name

                args = json.loads(tool_call.function.arguments)

                yield await send_event({
                    "type": "tool_running",
                    "tool": function_name
                })

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

                yield await send_event({
                    "type": "tool_completed",
                    "tool": function_name
                })

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": str(result)
                })

            continue

        stream = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=messages,
            stream=True
        )

        final_text = ""

        for chunk in stream:
            delta = chunk.choices[0].delta.content

            if delta:
                final_text += delta

                yield await send_event({
                    "type": "content",
                    "content": delta
                })

        return final_text
        