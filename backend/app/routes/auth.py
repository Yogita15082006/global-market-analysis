"""Authentication routes — status check and saved-events management (V-01, V-20 fix).

All endpoints require a valid Supabase JWT via ``Authorization: Bearer <token>``.
The ``user_id`` is always derived from the verified token — never from the request
body — preventing IDOR / spoofing attacks.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import AuthUser, get_current_user
from app.database.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()

SAVED_EVENTS_TABLE = "saved_events"


# ---------------------------------------------------------------------------
# Request / Response schemas (local to this module)
# ---------------------------------------------------------------------------

class SaveEventRequest(BaseModel):
    event_id: str


class AuthStatusResponse(BaseModel):
    authenticated: bool
    user_id: str
    email: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/status", response_model=AuthStatusResponse)
async def auth_status(user: AuthUser = Depends(get_current_user)) -> AuthStatusResponse:
    """Return the current user's authentication status.

    Returns 401 automatically when the token is missing or invalid.
    """
    return AuthStatusResponse(
        authenticated=True,
        user_id=user["id"],
        email=user["email"],
    )


@router.get("/saved")
async def list_saved_events(user: AuthUser = Depends(get_current_user)) -> dict:
    """Return all events saved by the authenticated user."""
    db = get_supabase()
    try:
        response = (
            db.table(SAVED_EVENTS_TABLE)
            .select("*, events(id, title, description, url, source, published_at)")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return {"saved": response.data or [], "total": len(response.data or [])}
    except Exception as exc:
        logger.exception("Failed to fetch saved events for user %s", user["id"])
        raise HTTPException(status_code=500, detail="Failed to fetch saved events") from exc


@router.post("/saved", status_code=201)
async def save_event(
    body: SaveEventRequest,
    user: AuthUser = Depends(get_current_user),
) -> dict:
    """Save an event for the authenticated user.

    Returns 409 if the event is already saved.
    """
    db = get_supabase()
    try:
        # Check for duplicate
        existing = (
            db.table(SAVED_EVENTS_TABLE)
            .select("id")
            .eq("user_id", user["id"])
            .eq("event_id", body.event_id)
            .execute()
        )
        if existing.data:
            raise HTTPException(status_code=409, detail="Event already saved")

        db.table(SAVED_EVENTS_TABLE).insert(
            {"user_id": user["id"], "event_id": body.event_id}
        ).execute()
        return {"status": "saved", "event_id": body.event_id}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to save event %s for user %s", body.event_id, user["id"])
        raise HTTPException(status_code=500, detail="Failed to save event") from exc


@router.delete("/saved/{event_id}", status_code=200)
async def unsave_event(
    event_id: str,
    user: AuthUser = Depends(get_current_user),
) -> dict:
    """Remove a saved event for the authenticated user.

    Returns 404 if the event was not previously saved by this user.
    """
    db = get_supabase()
    try:
        result = (
            db.table(SAVED_EVENTS_TABLE)
            .delete()
            .eq("user_id", user["id"])
            .eq("event_id", event_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Saved event not found")
        return {"status": "removed", "event_id": event_id}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to unsave event %s for user %s", event_id, user["id"])
        raise HTTPException(status_code=500, detail="Failed to remove saved event") from exc
