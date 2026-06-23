import logging
from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthError(AppError):
    def __init__(self, message: str = "로그인이 필요합니다.") -> None:
        super().__init__("UNAUTHORIZED", message, 401)


class ForbiddenError(AppError):
    def __init__(self, message: str = "접근 권한이 없습니다.") -> None:
        super().__init__("FORBIDDEN", message, 403)


class InvalidRequestError(AppError):
    def __init__(self, message: str = "입력한 여행 정보를 확인해 주세요.") -> None:
        super().__init__("INVALID_REQUEST", message, 400)


class RateLimitError(AppError):
    def __init__(self, message: str = "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.") -> None:
        super().__init__("RATE_LIMIT_EXCEEDED", message, 429)


class ConfigError(AppError):
    def __init__(self, message: str = "서버 설정을 확인해 주세요.") -> None:
        super().__init__("SERVER_CONFIG_ERROR", message, 500)


class AIResponseError(AppError):
    def __init__(self, message: str = "AI 응답을 처리하지 못했습니다. 다시 시도해 주세요.") -> None:
        super().__init__("AI_RESPONSE_ERROR", message, 502)


class AIProviderError(AppError):
    def __init__(self, message: str = "AI 서비스 응답이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.") -> None:
        super().__init__("AI_PROVIDER_ERROR", message, 502)


class AITimeoutError(AppError):
    def __init__(self, message: str = "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.") -> None:
        super().__init__("AI_TIMEOUT", message, 504)


def error_body(code: str, message: str) -> dict[str, dict[str, str]]:
    return {"error": {"code": code, "message": message}}


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=error_body(exc.code, exc.message))


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    logger.info("request_validation_failed", extra={"errors": exc.errors()})
    return JSONResponse(
        status_code=422,
        content=error_body("VALIDATION_ERROR", "입력한 여행 정보를 다시 확인해 주세요."),
    )


async def http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    message = "요청을 처리할 수 없습니다."
    code = "HTTP_ERROR"
    if exc.status_code == 404:
        message = "요청한 주소를 찾을 수 없습니다."
        code = "NOT_FOUND"
    return JSONResponse(status_code=exc.status_code, content=error_body(code, message))


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "unhandled_server_error",
        extra={"path": request.url.path, "method": request.method, "type": type(exc).__name__},
    )
    return JSONResponse(
        status_code=500,
        content=error_body("INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."),
    )


def public_log_context(**values: Any) -> dict[str, Any]:
    return {key: value for key, value in values.items() if value is not None}
