from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from keycloak.exceptions import KeycloakAuthenticationError
from pydantic import BaseModel

from app.core.config import keycloak_openid

router = APIRouter()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserInfo(BaseModel):
    preferred_username: str
    email: str | None = None
    full_name: str | None = None


async def get_user_info(
    token: Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="auth/token"))]
) -> UserInfo:
    try:
        user_info = keycloak_openid.userinfo(token)
        return UserInfo(
            preferred_username=user_info["preferred_username"],
            email=user_info.get("email"),
            full_name=user_info.get("name"),
        )
    except KeycloakAuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )


@router.post("/token", response_model=TokenResponse)
async def get_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    try:
        token = keycloak_openid.token(form_data.username, form_data.password)
        return TokenResponse(access_token=token["access_token"], token_type="Bearer")
    except KeycloakAuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
