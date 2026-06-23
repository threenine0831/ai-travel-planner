from __future__ import annotations

import re
from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


MAX_TRIP_DAYS = 14
MAX_TEXT = 200
MAX_LONG_TEXT = 800
MAX_TIPS = 12
MAX_ITEMS_PER_DAY = 12
MAX_COST = 1_000_000_000


def _clean_string(value: Any) -> Any:
    if isinstance(value, str):
        return re.sub(r"\s+", " ", value).strip()
    return value


def _parse_cost(value: Any) -> int:
    if value is None or value == "":
        return 0
    if isinstance(value, bool):
        raise ValueError("비용은 숫자여야 합니다.")
    if isinstance(value, (int, float)):
        parsed = int(value)
    elif isinstance(value, str):
        cleaned = re.sub(r"[^0-9.-]", "", value)
        if cleaned in {"", "-", ".", "-."}:
            parsed = 0
        else:
            parsed = int(float(cleaned))
    else:
        raise ValueError("비용은 숫자여야 합니다.")
    if parsed < 0 or parsed > MAX_COST:
        raise ValueError("비용 범위가 올바르지 않습니다.")
    return parsed


class ItineraryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True, extra="forbid")

    title: str = Field(min_length=1, max_length=80)
    destination: str = Field(min_length=1, max_length=80)
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    budget: int = Field(gt=0, le=MAX_COST)
    people: int = Field(ge=1, le=20)
    interests: list[str] = Field(min_length=1, max_length=8)
    additional_request: str = Field(default="", alias="additionalRequest", max_length=500)

    @field_validator("title", "destination", "additional_request", mode="before")
    @classmethod
    def clean_text(cls, value: Any) -> Any:
        return _clean_string(value)

    @field_validator("title", "destination")
    @classmethod
    def reject_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("필수 입력값입니다.")
        return value

    @field_validator("interests", mode="before")
    @classmethod
    def normalize_interests(cls, value: Any) -> Any:
        if not isinstance(value, list):
            return value
        cleaned: list[str] = []
        for item in value:
            item = _clean_string(item)
            if isinstance(item, str) and item and item not in cleaned:
                cleaned.append(item[:20])
        return cleaned

    @model_validator(mode="after")
    def validate_dates(self) -> "ItineraryRequest":
        if self.end_date < self.start_date:
            raise ValueError("종료일은 시작일보다 빠를 수 없습니다.")
        if self.trip_days > MAX_TRIP_DAYS:
            raise ValueError("여행 기간은 최대 14일까지 가능합니다.")
        return self

    @property
    def trip_days(self) -> int:
        return (self.end_date - self.start_date).days + 1


class ItineraryItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True, extra="ignore")

    time: str = Field(default="시간 미정", min_length=1, max_length=20)
    place: str = Field(default="장소 미정", min_length=1, max_length=100)
    activity: str = Field(default="일정 확인 필요", min_length=1, max_length=MAX_LONG_TEXT)
    estimated_cost: int = Field(default=0, alias="estimatedCost", ge=0, le=MAX_COST)
    notes: str = Field(default="", max_length=MAX_LONG_TEXT)

    @field_validator("time", "place", "activity", "notes", mode="before")
    @classmethod
    def clean_text(cls, value: Any) -> Any:
        return _clean_string(value) if value is not None else ""

    @field_validator("estimated_cost", mode="before")
    @classmethod
    def clean_cost(cls, value: Any) -> int:
        return _parse_cost(value)


class ItineraryDay(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    day: int = Field(ge=1, le=MAX_TRIP_DAYS)
    date: date
    items: list[ItineraryItem] = Field(min_length=1, max_length=MAX_ITEMS_PER_DAY)


class AIItinerary(BaseModel):
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True, extra="ignore")

    title: str = Field(min_length=1, max_length=100)
    destination: str = Field(min_length=1, max_length=80)
    summary: str = Field(default="", max_length=MAX_LONG_TEXT)
    estimated_budget: int = Field(default=0, alias="estimatedBudget", ge=0, le=MAX_COST)
    days: list[ItineraryDay] = Field(min_length=1, max_length=MAX_TRIP_DAYS)
    tips: list[str] = Field(default_factory=list, max_length=MAX_TIPS)

    @field_validator("title", "destination", "summary", mode="before")
    @classmethod
    def clean_text(cls, value: Any) -> Any:
        return _clean_string(value) if value is not None else ""

    @field_validator("estimated_budget", mode="before")
    @classmethod
    def clean_budget(cls, value: Any) -> int:
        return _parse_cost(value)

    @field_validator("tips", mode="before")
    @classmethod
    def clean_tips(cls, value: Any) -> list[str]:
        if value is None:
            return []
        if not isinstance(value, list):
            return []
        tips: list[str] = []
        for item in value:
            item = _clean_string(item)
            if isinstance(item, str) and item:
                tips.append(item[:MAX_LONG_TEXT])
            if len(tips) >= MAX_TIPS:
                break
        return tips


class AuthenticatedUser(BaseModel):
    uid: str
    email: str | None = None
    display_name: str | None = None
