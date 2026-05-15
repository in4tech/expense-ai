
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": """
            Seach memories, messages, and uploaded documents
            """
        },
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Seach query"
                }
            },
            "required": ["query"]
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": """
            Search realtime internet data.
            User for:
            - latest news
            - current events
            - factual internet lookup
            - realtime information
            """,
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string"
                    }
                },
                "required": ["query"]
            }
        }
    },
]