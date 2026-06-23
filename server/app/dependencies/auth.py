from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models.itinerary import AuthenticatedUser
from app.services import firebase_service
from app.utils.exceptions import AuthError

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise AuthError("로그인이 필요합니다. 다시 로그인해 주세요.")

    decoded = firebase_service.verify_id_token(credentials.credentials)
    uid = decoded.get("uid") or decoded.get("sub")
    if not uid:
        raise AuthError("로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.")

    return AuthenticatedUser(
        uid=uid,
        email=decoded.get("email"),
        display_name=decoded.get("name") or decoded.get("displayName"),
    )
