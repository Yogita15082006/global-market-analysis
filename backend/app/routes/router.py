from fastapi import APIRouter

from app.routes.analysis import router as analysis_router
from app.routes.analytics import router as analytics_router
from app.routes.chat import router as chat_router
from app.routes.dashboard import router as dashboard_router
from app.routes.events import router as events_router
from app.routes.market import router as market_router
from app.routes.briefings import router as briefings_router
from app.routes.auth import router as auth_router
from app.routes.database import router as database_router

api_router = APIRouter()

api_router.include_router(database_router, tags=["database"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(events_router, prefix="/events", tags=["events"])
api_router.include_router(analysis_router, prefix="/analysis", tags=["analysis"])
api_router.include_router(analytics_router, tags=["analytics"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(market_router, prefix="/market", tags=["market"])
api_router.include_router(briefings_router, prefix="/briefings", tags=["briefings"])
