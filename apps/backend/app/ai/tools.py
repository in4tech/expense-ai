
TOOLS = [
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