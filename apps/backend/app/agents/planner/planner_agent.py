import json
from app.db.session import CHAT_MODELS, client

async def create_plan(
    user_query,
    memory_context
):
    response = await client.chat.completions.create(
        model=CHAT_MODELS,
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": f"""
                You are a planning agent.

                Known user memories:
                {memory_context or "(none)"}

                Break the user request into executable tasks. Always include at least one task.

                Available tools:
                - search_knowledge_base
                - search_web

                Return JSON:

                {{
                    "tasks": [
                        {{
                            "step": 1,
                            "task": "...",
                            "tool": "..."
                        }}
                    ]
                }}
                """
            },
            {
                "role": "user",
                "content": user_query
            }
        ]
    )

    content = response.choices[0].message.content

    return json.loads(content)