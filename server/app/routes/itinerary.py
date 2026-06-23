from __future__ import annotations

import hashlib
import logging

from fastapi import APIRouter, Depends, Request

from app.config import get_settings
from app.dependencies.auth import get_current_user
from app.middleware.rate_limit import build_rate_limit_key, rate_limiter
from app.models.itinerary import AIItinerary, AuthenticatedUser, ItineraryRequest
from app.services.ai_service import generate_itinerary

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["itinerary"])


def _safe_user_hash(uid: str) -> str:
    return hashlib.sha256(uid.encode("utf-8")).hexdigest()[:12]


@router.post("/generate-itinerary", response_model=AIItinerary)
async def generate_itinerary_route(
    payload: ItineraryRequest,
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AIItinerary:
    settings = get_settings()
    key = build_rate_limit_key(request, current_user.uid)
    rate_limiter.check(key, settings.rate_limit_per_minute)
    logger.info(
        "itinerary_generation_requested",
        extra={
            "user_hash": _safe_user_hash(current_user.uid),
            "destination": payload.destination,
            "days": payload.trip_days,
        },
    )
    return await generate_itinerary(payload)
