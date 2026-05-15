

import json

from app.db.session import CHAT_MODELS, client
from app.tools.tool_definitions import TOOLS
from app.tools.agent_tools import TOOLS_MAP


async def executor_loop(
    db,
    task,
    memory_context,
    user_id,
    conversation_id,
    send_event,
    max_iteration=5,
    completion: list[str] | None = None,
):
    out = completion if completion is not None else []

    task_text = str(task.get("task", "")).strip()
    if not task_text:
        task_text = "(empty subtask)"

    messages = [
        {
            "role": "system",
            "content": f"""
            You are an executor agent.

            Solve the assigned task using tools when helpful.

            Relevant user memories:
            {memory_context or "(none)"}
            """,
        },
        {
            "role": "user",
            "content": task_text,
        },
    ]

    for iteration in range(max_iteration):
        yield send_event({
            "type": "executor_iteration",
            "iteration": iteration + 1,
        })

        response = await client.chat.completions.create(
            model=CHAT_MODELS,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )

        assistant_message = response.choices[0].message

        if assistant_message.tool_calls:
            messages.append({
                "role": "assistant",
                "content": assistant_message.content,
                "tool_calls": assistant_message.tool_calls,
            })

            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)

                yield send_event({
                    "type": "tool_running",
                    "tool": function_name,
                })

                if function_name == "search_knowledge_base":
                    result = await TOOLS_MAP[function_name](
                        db=db,
                        query=args["query"],
                        user_id=user_id,
                        conversation_id=conversation_id,
                    )
                elif function_name == "search_web":
                    result = await TOOLS_MAP[function_name](
                        query=args["query"],
                    )
                else:
                    result = "Unknown tool"

                yield send_event({
                    "type": "tool_completed",
                    "tool": function_name,
                })

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": str(result),
                })
            continue

        text = (assistant_message.content or "").strip()
        messages.append({
            "role": "assistant",
            "content": assistant_message.content or "",
        })
        out.append(text if text else "(no text reply)")
        break

    if not out:
        out.append("(executor did not produce a final reply)")
