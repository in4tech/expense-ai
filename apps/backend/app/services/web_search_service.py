from tavily import TavilyClient

from app.core.config import settings


async def search_web(query):
    if not settings.TAVILY_API_KEY:
        return (
            "Web search is not configured: set TAVILY_API_KEY in the environment "
            "or in .env to use Tavily search."
        )

    client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    response = client.search(
        query=query,
        search_depth="advanced",
        max_results=5
    )

    results = response["results"]

    formatted = ""
    for item in results:
        formatted += f"""
        Title:
        {item["title"]}

        URL:
        {item["url"]}

        Content:
        {item["content"]}
        
        """

    return formatted