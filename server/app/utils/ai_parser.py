from __future__ import annotations

import json
import re
from datetime import timedelta
from typing import Any

from pydantic import ValidationError

from app.models.itinerary import AIItinerary, ItineraryRequest
from app.utils.exceptions import AIResponseError


def strip_markdown_code_fences(text: str) -> str:
    cleaned = text.strip()
    fenced = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", cleaned, flags=re.IGNORECASE | re.DOTALL)
    if fenced:
        return fenced.group(1).strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def extract_json_object(text: str) -> dict[str, Any]:
    cleaned = strip_markdown_code_fences(text)
    decoder = json.JSONDecoder()
    for index, character in enumerate(cleaned):
        if character != "{":
            continue
        try:
            parsed, _ = decoder.raw_decode(cleaned[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
    raise AIResponseError("AI가 올바른 JSON 형식으로 응답하지 않았습니다. 다시 시도해 주세요.")


def _get_value(data: dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return default


def _normalize_top_level(data: dict[str, Any], request: ItineraryRequest) -> dict[str, Any]:
    normalized = {
        "title": _get_value(data, "title", default=request.title),
        "destination": _get_value(data, "destination", default=request.destination),
        "summary": _get_value(data, "summary", default=""),
        "estimatedBudget": _get_value(data, "estimatedBudget", "estimated_budget", default=request.budget),
        "days": _get_value(data, "days", default=[]),
        "tips": _get_value(data, "tips", default=[]),
    }
    if not isinstance(normalized["days"], list) or not normalized["days"]:
        raise AIResponseError("AI가 날짜별 일정을 생성하지 못했습니다. 다시 시도해 주세요.")
    return normalized


def normalize_ai_response(raw_text: str, request: ItineraryRequest) -> AIItinerary:
    if not raw_text or not raw_text.strip():
        raise AIResponseError("AI 응답이 비어 있습니다. 다시 시도해 주세요.")

    raw_data = extract_json_object(raw_text)
    normalized = _normalize_top_level(raw_data, request)

    try:
        itinerary = AIItinerary.model_validate(normalized)
    except ValidationError as exc:
        raise AIResponseError("AI 응답 구조가 올바르지 않습니다. 다시 시도해 주세요.") from exc

    if len(itinerary.days) != request.trip_days:
        raise AIResponseError("AI가 요청한 여행 기간과 다른 일정 수를 반환했습니다. 다시 시도해 주세요.")

    valid_dates = {request.start_date + timedelta(days=offset) for offset in range(request.trip_days)}
    seen_dates = set()
    for expected_index, day in enumerate(itinerary.days, start=1):
        if day.day != expected_index:
            raise AIResponseError("AI 응답의 날짜 순서가 올바르지 않습니다. 다시 시도해 주세요.")
        if day.date not in valid_dates:
            raise AIResponseError("AI 일정에 여행 날짜 범위를 벗어난 날짜가 포함되어 있습니다.")
        seen_dates.add(day.date)

    if seen_dates != valid_dates:
        raise AIResponseError("AI 일정에 누락된 여행 날짜가 있습니다. 다시 시도해 주세요.")

    return itinerary
