from __future__ import annotations

import logging

import firebase_admin
from firebase_admin import auth, credentials

from app.config import Settings, get_settings
from app.utils.exceptions import AuthError, ConfigError

logger = logging.getLogger(__name__)


def _firebase_config_available(settings: Settings) -> bool:
    return bool(
        settings.firebase_project_id
        and settings.firebase_client_email
        and settings.normalized_private_key
    )


def get_firebase_app(settings: Settings | None = None) -> firebase_admin.App:
    settings = settings or get_settings()
    if firebase_admin._apps:
        return firebase_admin.get_app()
    if not _firebase_config_available(settings):
        raise ConfigError("Firebase Admin 환경변수가 설정되지 않았습니다.")

    service_account_info = {
        "type": "service_account",
        "project_id": settings.firebase_project_id,
        "private_key_id": "render-env",
        "private_key": settings.normalized_private_key,
        "client_email": settings.firebase_client_email,
        "client_id": "",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": (
            "https://www.googleapis.com/robot/v1/metadata/x509/"
            f"{settings.firebase_client_email}"
        ),
    }
    cred = credentials.Certificate(service_account_info)
    logger.info("firebase_admin_initializing")
    return firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})


def verify_id_token(id_token: str) -> dict:
    try:
        get_firebase_app()
        return auth.verify_id_token(id_token, check_revoked=True)
    except ConfigError:
        raise
    except Exception as exc:
        logger.info("firebase_token_verification_failed", extra={"error_type": type(exc).__name__})
        raise AuthError("로그인 정보가 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요.") from exc
