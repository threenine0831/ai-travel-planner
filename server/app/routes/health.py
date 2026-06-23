from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def root() -> dict[str, str]:
    return {"message": "AI 여행 일정 플래너 API", "status": "ok"}


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}
