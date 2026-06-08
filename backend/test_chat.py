import asyncio
import logging
logging.basicConfig(level=logging.DEBUG)
from app.services.chat_service import ChatService

async def test():
    svc = ChatService()
    res = await svc.ask('silver mining in peru')
    print('Found sources:', len(res.sources))
    print('Top sources:', [s.title for s in res.sources[:3]])

if __name__ == "__main__":
    asyncio.run(test())
