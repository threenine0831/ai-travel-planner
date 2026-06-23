import pytest

from app.models.itinerary import ItineraryRequest
from app.utils.ai_parser import normalize_ai_response
from app.utils.exceptions import AIResponseError
from tests.test_validation import valid_payload


def request_model():
    return ItineraryRequest.model_validate(valid_payload())


def test_ai_response_parser_accepts_code_block_and_string_costs():
    raw = """
```json
{
  "title": "부산 2박 3일 여행",
  "destination": "부산",
  "summary": "부산의 바다와 맛집을 함께 즐기는 일정입니다.",
  "estimatedBudget": "480,000원",
  "days": [
    {
      "day": 1,
      "date": "2026-07-01",
      "items": [
        {
          "time": "09:00",
          "place": "부산역",
          "activity": "도착 후 이동",
          "estimatedCost": "0원",
          "notes": "대중교통 이용"
        }
      ]
    },
    {
      "day": 2,
      "date": "2026-07-02",
      "items": [
        {
          "time": "10:00",
          "place": "해운대",
          "activity": "해변 산책",
          "estimatedCost": 15000,
          "notes": "점심 포함"
        }
      ]
    },
    {
      "day": 3,
      "date": "2026-07-03",
      "items": [
        {
          "time": "11:00",
          "place": "감천문화마을",
          "activity": "사진 촬영",
          "estimatedCost": 20000,
          "notes": "도보 이동"
        }
      ]
    }
  ],
  "tips": ["교통카드를 준비하세요."]
}
```
"""
    itinerary = normalize_ai_response(raw, request_model())
    assert itinerary.estimated_budget == 480000
    assert len(itinerary.days) == 3


def test_ai_response_missing_required_days_fails():
    raw = '{"title":"부산","destination":"부산","summary":"요약","estimatedBudget":100000,"tips":[]}'
    with pytest.raises(AIResponseError):
        normalize_ai_response(raw, request_model())


def test_ai_response_out_of_range_date_fails():
    raw = """
{
  "title": "부산",
  "destination": "부산",
  "summary": "요약",
  "estimatedBudget": 100000,
  "days": [
    {"day": 1, "date": "2026-07-01", "items": [{"time": "09:00", "place": "A", "activity": "B", "estimatedCost": 0, "notes": ""}]},
    {"day": 2, "date": "2026-07-02", "items": [{"time": "09:00", "place": "A", "activity": "B", "estimatedCost": 0, "notes": ""}]},
    {"day": 3, "date": "2026-07-10", "items": [{"time": "09:00", "place": "A", "activity": "B", "estimatedCost": 0, "notes": ""}]}
  ],
  "tips": []
}
"""
    with pytest.raises(AIResponseError):
        normalize_ai_response(raw, request_model())
