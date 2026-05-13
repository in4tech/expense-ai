from tavily import TavilyClient

from app.config import settings


client = TavilyClient(
    api_key=settings.TAVILY_API_KEY
)

async def search_web(query):
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