from requests_cache import CachedSession
from api.util import constants

session = CachedSession('keycloak_userinfo_cache', expire_after=300, match_headers=True)


class KeycloakService:
    @staticmethod
    def validate_token(token):
        r = session.get(
            constants.KC_USERINFO_URL,
            headers={'Authorization': token}
        )
        if r.status_code == 200:
            return True
        else:
            return False
