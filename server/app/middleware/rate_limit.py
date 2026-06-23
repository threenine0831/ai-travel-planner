from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field

from fastapi import Request

from app.utils.exceptions import RateLimitError


@dataclass
class InMemoryRateLimiter:
    window_seconds: int = 60
    buckets: dict[str, deque[float]] = field(default_factory=lambda: defaultdict(deque))
    lock: threading.Lock = field(default_factory=threading.Lock)

    def check(self, key: str, limit: int) -> None:
        now = time.monotonic()
        with self.lock:
            bucket = self.buckets[key]
            while bucket and now - bucket[0] >= self.window_seconds:
                bucket.popleft()
            if len(bucket) >= limit:
                raise RateLimitError()
            bucket.append(now)


rate_limiter = InMemoryRateLimiter()


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def build_rate_limit_key(request: Request, user_uid: str | None = None) -> str:
    if user_uid:
        return f"user:{user_uid}"
    return f"ip:{get_client_ip(request)}"
