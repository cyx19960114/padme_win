import requests
import os

from .vault_service import VaultService
from api.util import constants


class AuthenticationService:
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
        # 开发模式：跳过真实GitLab验证
        vault_dev_mode = os.getenv("VAULT_DEV_MODE", "false").lower() == "true"
        
        if vault_dev_mode:
            # 开发模式：接受任何非空用户名和令牌
            if username and pat:
                # 模拟保存用户凭据（不实际保存到Vault）
                print(f"Dev mode: Accepting user {username} with token {pat[:10]}...")
                return {"status_code": 200, "message": "Valid user (dev mode)!!!"}
            else:
                return {"status_code": 401, "message": "Please provide both username and token"}
        
        # 生产模式：原始GitLab验证逻辑
        try:
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
                    AuthenticationService.save_user_credentials(
                        username, pat, member_name, member_access_level, kc_username)
                    return {"status_code": 200, "message": "Valid user!!!"}
        except Exception as e:
            print(f"GitLab authentication error: {e}")
            return {"status_code": 500, "message": f"GitLab connection error: {str(e)}"}

    @staticmethod
    def revoke_token(kc_username):
        # Erase logged-in user credentials:  username and pat
        try:
            VaultService().delete_secret(kc_username)
            return {"status_code": 200, "message": constants.MESSAGE_SUCCESS_LOGOFF}
        except OSError:
            return {"status_code": 400, "message": constants.ERROR_LOGOFF}

    @staticmethod
    def verify_user(kc_username):
        vault_dev_mode = os.getenv("VAULT_DEV_MODE", "false").lower() == "true"
        
        if vault_dev_mode:
            # 开发模式：返回模拟的用户验证
            print(f"Dev mode: Verifying user {kc_username}")
            return {"status_code": 200, "message": constants.MESSAGE_SUCCESS_VERIFY, "pat": "dev-token-12345"}
        
        # 生产模式：原始Vault验证逻辑
        try:
            response = VaultService().get_secret(kc_username)
            if response:
                return {"status_code": 200, "message": constants.MESSAGE_SUCCESS_VERIFY, "pat": response['pat']}
            else:
                print(f"Could not verify user {kc_username}, got no vault secret for user")
                return {"status_code": 401, "message": constants.ERROR_VERIFY}
        except Exception as e:
            print(f"Vault verification error: {e}")
            return {"status_code": 401, "message": constants.ERROR_VERIFY}
