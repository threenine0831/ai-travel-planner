from __future__ import annotations

import asyncio
import logging
from datetime import timedelta

from app.config import get_settings
from app.models.itinerary import AIItinerary, ItineraryRequest
from app.utils.ai_parser import normalize_ai_response
from app.utils.exceptions import AIProviderError, AITimeoutError, ConfigError

logger = logging.getLogger(__name__)


def _prefers_budget_saving(additional_request: str | None) -> bool:
    text = (additional_request or "").lower()
    saving_keywords = ("절약", "가성비", "저렴", "아껴", "아끼", "최대한 싸", "저예산", "경제적")
    return any(keyword in text for keyword in saving_keywords)


def _budget_guidance(request: ItineraryRequest) -> str:
    if _prefers_budget_saving(request.additional_request):
        return """
- 사용자가 절약 또는 가성비를 요청했으므로, 현지 사용 예산 이하에서 합리적으로 낮춰 구성해도 됩니다.
- 그래도 너무 빈약한 일정이 되지 않도록 핵심 식사, 교통, 입장료, 체험 비용은 반드시 반영합니다.
""".strip()

    target_min = int(request.budget * 0.75)
    target_max = int(request.budget * 0.95)
    return f"""
- 특별히 절약 요청이 없으므로 estimatedBudget은 현지 사용 예산의 75~95%에 가깝게 맞춥니다.
- 이번 요청의 권장 현지 지출 범위는 {target_min}원부터 {target_max}원까지입니다.
- 예산이 넉넉하면 더 좋은 식사, 유료 체험, 편한 현지 이동, 전망 좋은 장소 등으로 여행 품질을 높입니다.
- 특별한 이유 없이 입력 예산의 절반 이하로만 쓰는 일정을 만들지 않습니다.
""".strip()


def _max_output_tokens_for_trip(trip_days: int, configured_limit: int) -> int:
    estimated_limit = 1500 + (trip_days * 450)
    return max(2200, min(configured_limit, estimated_limit))


def _build_prompt(request: ItineraryRequest) -> str:
    trip_days = request.trip_days
    dates = [
        (request.start_date + timedelta(days=offset)).isoformat()
        for offset in range(trip_days)
    ]
    additional = request.additional_request or "없음"
    return f"""
당신은 한국어로 답변하는 전문 여행 일정 플래너입니다.
아래 조건에 맞는 현실적인 여행 일정을 만들어 주세요.

여행 제목: {request.title}
여행지: {request.destination}
여행 날짜: {request.start_date.isoformat()}부터 {request.end_date.isoformat()}까지
여행 일수: {trip_days}일
반드시 포함할 날짜: {", ".join(dates)}
현지 사용 예산(항공권과 숙소 비용 제외): {request.budget}원
여행 인원: {request.people}명
관심사: {", ".join(request.interests)}
추가 요청사항: {additional}

작성 규칙:
- 모든 내용은 한국어로 작성합니다.
- 날짜별 일정은 실제 이동 시간과 식사 시간을 고려합니다.
- 예산은 항공권과 숙소 비용을 제외한 현지 사용 예산입니다.
- 식비, 현지 교통비, 입장료, 체험비, 쇼핑 등 여행지에서 직접 쓰는 비용만 고려합니다.
- 현지 사용 예산을 초과하지 않습니다.
{_budget_guidance(request)}
- 빠른 응답을 위해 각 날짜의 items는 핵심 일정 3~5개로 제한합니다.
- summary는 2문장 이하, notes는 80자 이하, tips는 3~5개로 간결하게 작성합니다.
- days 배열 길이는 반드시 {trip_days}개입니다.
- day 값은 1부터 순서대로 증가해야 합니다.
- date 값은 반드시 요청 날짜 범위 안의 YYYY-MM-DD 형식이어야 합니다.
- 각 날짜의 items 배열은 최소 1개 이상이어야 합니다.
- estimatedBudget과 estimatedCost는 항공권과 숙소 비용을 제외한 현지 지출 비용 숫자로 작성합니다.
- JSON만 반환합니다.
- 마크다운 코드 블록, 설명 문장, 주석은 절대 사용하지 않습니다.

반환 JSON 구조:
{{
  "title": "여행 일정 제목",
  "destination": "여행지",
  "summary": "전체 여행 소개",
  "estimatedBudget": 500000,
  "days": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",
      "items": [
        {{
          "time": "09:00",
          "place": "장소명",
          "activity": "활동 내용",
          "estimatedCost": 10000,
          "notes": "이동 방법 또는 참고사항"
        }}
      ]
    }}
  ],
  "tips": ["여행 팁 1", "여행 팁 2"]
}}
""".strip()


def _extract_text(response: object) -> str:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text
    candidates = getattr(response, "candidates", None)
    if candidates:
        parts: list[str] = []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            for part in getattr(content, "parts", []) or []:
                part_text = getattr(part, "text", None)
                if part_text:
                    parts.append(part_text)
        if parts:
            return "\n".join(parts)
    return ""


async def generate_itinerary(request: ItineraryRequest) -> AIItinerary:
    settings = get_settings()
    if not settings.google_ai_api_key:
        raise ConfigError("GOOGLE_AI_API_KEY가 설정되지 않았습니다.")

    try:
        from google import genai
        from google.genai import types
    except Exception as exc:  # pragma: no cover - covered by deployment dependency checks
        raise ConfigError("Google Gen AI SDK를 불러오지 못했습니다.") from exc

    client = genai.Client(api_key=settings.google_ai_api_key)
    prompt = _build_prompt(request)
    max_output_tokens = _max_output_tokens_for_trip(request.trip_days, settings.ai_max_output_tokens)
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=settings.ai_temperature,
        max_output_tokens=max_output_tokens,
    )
    logger.info(
        "google_ai_request_started",
        extra={
            "model": settings.google_ai_model,
            "trip_days": request.trip_days,
            "max_output_tokens": max_output_tokens,
        },
    )

    def call_model() -> object:
        return client.models.generate_content(
            model=settings.google_ai_model,
            contents=prompt,
            config=config,
        )

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(call_model),
            timeout=settings.ai_timeout_seconds,
        )
    except asyncio.TimeoutError as exc:
        raise AITimeoutError() from exc
    except Exception as exc:
        logger.warning("google_ai_request_failed", extra={"error_type": type(exc).__name__})
        raise AIProviderError() from exc

    raw_text = _extract_text(response)
    return normalize_ai_response(raw_text, request)
