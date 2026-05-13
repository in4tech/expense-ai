
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_documents",
            "description": """
            Search relevant document chunks
            from uploaded PDFs
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
    {
        "type": "function",
        "function": {
            "name": "get_recents_messages",
            "description": """
            Get recent conversation message
            """,
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer"
                    }
                }
            }
        }
    }
]