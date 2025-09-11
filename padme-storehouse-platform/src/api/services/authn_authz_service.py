import requests
from flask import current_app
from werkzeug.exceptions import BadRequest, NotFound

from .vault_service import VaultService
from api.util import constants


class AuthenticationAuthorizationService:
    @staticmethod
    def save_user_credentials(username, pat, member_name, member_access_level, kc_username):
        user_info = {
            "uname": username,
            "pat": pat,
            "member_name": member_name,
            "access_level": member_access_level
        }
        VaultService().put_secret(kc_username, user_info)

    @staticmethod
    def authenticate_username_pat(username, pat, kc_username):
        # Fetch project members
        project_members_header = {"PRIVATE-TOKEN": pat}
        project_members_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/groups/" + str(
            constants.GITLAB_PADME_GROUP_ID) + "/members?per_page=" + str(constants.QUERY_PARAM_PER_PAGE)

        project_members_response = requests.get(project_members_url, headers=project_members_header)
        if project_members_response.status_code == 401 or project_members_response.status_code == 403:
            return {"status_code": 401, "message": "Unauthorized user!!! Please check your personal access token."}
        else:
            flag = True
            member_name = ""
            member_access_level = ""
            project_members_response_json = project_members_response.json()
            for member in project_members_response_json:
                if username == member['username']:
                    if member['state'] == constants.ACTIVE_GIT_PROJECT_USER_LABEL:
                        member_name = member['name']
                        member_access_level = member['access_level']
                        flag = False
                        break

            if flag:
                return {"status_code": 401, "message": "Unauthorized user!!! Please check your username."}
            else:
                AuthenticationAuthorizationService.save_user_credentials(
                    username, pat, member_name, member_access_level, kc_username)
                return {"status_code": 200, "message": "Valid user!!!"}

    @staticmethod
    def revoke_token(kc_username):
        # Erase logged-in user credentials:  username and pat
        try:
            VaultService().delete_secret(kc_username)
            return {"status_code": 200, "message": constants.SUCCESS_LOGOFF}
        except OSError:
            return {"status_code": 400, "message": constants.ERROR_LOGOFF}

    @staticmethod
    def verify_user(kc_username):
        response = VaultService().get_secret(kc_username)
        if response:
            return {"status_code": 200, "message": constants.SUCCESS_VERIFY, "pat": response['pat']}
        else:
            return {"status_code": 401, "message": constants.ERROR_VERIFY}
