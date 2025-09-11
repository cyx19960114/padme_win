from typing import Annotated, Any, Literal

from keycloak import KeycloakOpenID
from pydantic import AnyUrl, computed_field, BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file="../.env",
        extra="ignore",
    )

    ENVIRONMENT: Literal["local", "production"] = "local"

    PROJECT_NAME: str
    DOMAIN: str
    FRONTEND_HOST: str

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []
    
    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    DB_URL_DATABASE: str
    DB_URL_HOST: str
    DB_URL_PORT: int
    DB_USERNAME: str
    DB_PASSWORD: str

    # Redis settings
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    KEYCLOAK_SERVER_URL: str
    KEYCLOAK_REALM: str
    KEYCLOAK_CLIENT_ID: str
    KEYCLOAK_CLIENT_SECRET: str


settings = Settings()

keycloak_openid = KeycloakOpenID(
    server_url=settings.KEYCLOAK_SERVER_URL,
    realm_name=settings.KEYCLOAK_REALM,
    client_id=settings.KEYCLOAK_CLIENT_ID,
    client_secret_key=settings.KEYCLOAK_CLIENT_SECRET,
)
