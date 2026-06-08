from fastapi import APIRouter
from typing import Any

from app.services.dashboard_service import DashboardService

router = APIRouter()
dashboard_service = DashboardService()

@router.get("", response_model=dict[str, Any])
async def get_dashboard() -> dict[str, Any]:
    """Get the intelligence dashboard summary."""
    return dashboard_service.get_dashboard_summary()
