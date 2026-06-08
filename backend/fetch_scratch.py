import asyncio
import sys
import os

# Ensure the backend directory is in the path
sys.path.append("c:/global/backend")

from app.services.news_service import NewsService

async def main():
    print("Initializing NewsService...")
    service = NewsService()
    
    print("Querying latest 5 events to verify relevance_score...")
    res = service.db.table("events").select("title, relevance_score").order("created_at", desc=True).limit(5).execute()
    for row in res.data:
        print(f"DB Title: {row['title']}, Score: {row['relevance_score']}")

if __name__ == "__main__":
    asyncio.run(main())
