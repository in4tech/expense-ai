import json
from db.session import CHAT_MODELS, client

async def create_plan(user_query):
    response = client.chat.completions.create(
        model=CHAT_MODELS,
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": f"""
                You are a planning agent.

                Break the user request into executable tasks.

                Return JSON:

                {
                    "tasks": [
                        {
                            "step": 1,
                            "task": "..."
                            "tool": "..."
                        }
                    ]
                }
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