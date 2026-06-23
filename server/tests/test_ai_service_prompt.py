from app.models.itinerary import ItineraryRequest
from app.services.ai_service import _build_prompt, _max_output_tokens_for_trip
from tests.test_validation import valid_payload


def test_prompt_uses_budget_target_range_when_not_saving():
    payload = valid_payload()
    payload["budget"] = 1_000_000
    payload["additionalRequest"] = "해산물 식당을 포함해 주세요."
    request = ItineraryRequest.model_validate(payload)

    prompt = _build_prompt(request)

    assert "현지 사용 예산(항공권과 숙소 비용 제외): 1000000원" in prompt
    assert "75~95%" in prompt
    assert "750000원부터 950000원까지" in prompt
    assert "입력 예산의 절반 이하" in prompt


def test_prompt_allows_lower_budget_when_saving_requested():
    payload = valid_payload()
    payload["budget"] = 1_000_000
    payload["additionalRequest"] = "가성비 있게 절약해서 다니고 싶어요."
    request = ItineraryRequest.model_validate(payload)

    prompt = _build_prompt(request)

    assert "절약 또는 가성비를 요청" in prompt
    assert "750000원부터 950000원까지" not in prompt


def test_output_token_limit_scales_by_trip_days():
    assert _max_output_tokens_for_trip(1, 8192) == 2200
    assert _max_output_tokens_for_trip(3, 8192) == 2850
    assert _max_output_tokens_for_trip(14, 8192) == 7800
    assert _max_output_tokens_for_trip(14, 4096) == 4096
