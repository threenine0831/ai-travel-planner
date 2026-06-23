from pydantic import ValidationError
import pytest

from app.models.itinerary import ItineraryRequest


def valid_payload():
    return {
        "title": "부산 2박 3일 여행",
        "destination": "부산",
        "startDate": "2026-07-01",
        "endDate": "2026-07-03",
        "budget": 500000,
        "people": 2,
        "interests": ["맛집", "관광", "사진"],
        "additionalRequest": "대중교통을 이용해 주세요.",
    }


def test_valid_request():
    request = ItineraryRequest.model_validate(valid_payload())
    assert request.trip_days == 3
    assert request.title == "부산 2박 3일 여행"


def test_required_title_missing():
    payload = valid_payload()
    payload.pop("title")
    with pytest.raises(ValidationError):
        ItineraryRequest.model_validate(payload)


def test_invalid_date_format():
    payload = valid_payload()
    payload["startDate"] = "2026/07/01"
    with pytest.raises(ValidationError):
        ItineraryRequest.model_validate(payload)


def test_end_date_before_start_date():
    payload = valid_payload()
    payload["endDate"] = "2026-06-30"
    with pytest.raises(ValidationError):
        ItineraryRequest.model_validate(payload)


def test_trip_longer_than_14_days():
    payload = valid_payload()
    payload["endDate"] = "2026-07-20"
    with pytest.raises(ValidationError):
        ItineraryRequest.model_validate(payload)


def test_invalid_budget():
    payload = valid_payload()
    payload["budget"] = 0
    with pytest.raises(ValidationError):
        ItineraryRequest.model_validate(payload)
