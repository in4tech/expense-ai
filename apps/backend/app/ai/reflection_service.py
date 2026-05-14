import json
from app.db.session import CHAT_MODELS, client

async def reflect_response(
    user_query,
    draft_answer
):
    response = await client.chat.completions.create(
        model=CHAT_MODELS,
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": """
                You are a reflection engine.

                Your task:
                - analyze AI response quality
                - detect hallucinations
                - detect missing information
                - detect vague reasoning
                - determine if retrieval is insufficient

                Return JSON:

                {
                    "needs_improvement": true,
                    "issues": [
                        "..."
                    ],
                    "improved_query": "...",
                    "confidence": 0.0
                }
                """
            },
            {
                "role": "user",
                "content": f"""
                USER QUERY:

                {user_query}

                AI RESPONSE:

                {draft_answer}
                
                """
            }
        ]
    )

    content = response.choices[0].message.content
    return json.loads(content)


async def improve_response(
    user_query,
    draft_answer,
    reflection
):
    response = await client.chat.completions.create(
        model=CHAT_MODELS,
        messages=[
            {
                "role": "system",
                "content": """
                Improve the response using reflection feedback.

                Fix:
                - hallucinations
                - missing information
                - vague explanations
                - unsupported claims
                - poor structure
                """
            },
            {
                "role": "user",
                "content": f"""
                USER QUERY:

                {user_query}

                DRAFT ANSWER:

                {draft_answer}

                REFLECTION:

                {reflection}
                
                """
            }
        ]
    )

    return response.choices[0].message.content

async def reflection_pipeline(
    user_query,
    draft_answer
):
    reflection = await reflect_response(
        user_query=user_query,
        draft_answer=draft_answer
    )

    needs_improvement = reflection["needs_improvement"]
    confidence = reflection["confidence"]

    if(needs_improvement and confidence < 0.8):
        improved_anwswer = await improve_response(
            user_query=user_query,
            draft_answer=draft_answer,
            reflection=reflection
        )

        return {
            "final_answer": improved_anwswer,
            "reflection": reflection,
            "improved": True
        }

    return {
        "final_answer": draft_answer,
        "reflection": reflection,
        "improved": False
    }