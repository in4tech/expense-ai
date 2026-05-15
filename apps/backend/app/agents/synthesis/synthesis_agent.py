
from app.db.session import CHAT_MODELS, client

async def synthesis_stream(
    user_query,
    execution_results
):
    stream = await client.chat.completions.create(
        model=CHAT_MODELS,
        stream=True,
        messages=[
            {
                "role": "system",
                "content": """
                You are a synthesis agent.

                Combine all execution results in final answer.
                """
            },
            {
                "role": "user",
                "content": f"""
                
                USER QUERY:

                {user_query}
                
                EXECUTION RESULTS:
                
                {execution_results}

                """
            }
        ]
    )

    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content

        if delta:
            yield delta