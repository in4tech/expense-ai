
import json

from app.db.session import CHAT_MODELS, client
from app.ai.tools import TOOLS
from app.ai.agent_tools import TOOLS_MAP
from app.ai.reflection_service import reflection_pipeline

async def run_agent(
    db,
    user_message,
    user_id,
    conversation_id,
    max_iteration=5
):
    messages = [
        {
            "role": "system",
            "content": """
            You are an advanced AI agent.and

            Use tools when necessary.
            Think step-by-step
            """
        },
        {
            "role": "user",
            "content": user_message
        }
    ]

    for iteration in range(max_iteration):
        response = await client.chat.completions.create(
            model=CHAT_MODELS,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto"
        )

        assistant_message = response.choices[0].message
        if assistant_message.tool_calls:
            messages.append({
                "role": "assistant",
                "tool_calls": assistant_message.tool_calls
            })

            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)

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

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": str(result)
                })

            continue

        draft_answer = assistant_message.content

        relection_result = await reflection_pipeline(
            user_query=user_message,
            draft_answer=draft_answer
        )

        final_answer = relection_result["final_answer"]
        return final_answer

    return "Agent reached max iterations."



