import os
import hvac
from flask import current_app
from threading import Timer

class VaultService(object):
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VaultService, cls).__new__(cls)
            vault_url = os.getenv("VAULT_URL")
            vault_dev_mode = os.getenv("VAULT_DEV_MODE", "false").lower() == "true"
            vault_skip_verify = os.getenv("VAULT_SKIP_VERIFY", "false").lower() == "true"
            
            if vault_dev_mode or vault_skip_verify:
                # 开发模式：禁用TLS验证
                cls._instance.client = hvac.Client(url=vault_url, verify=False)
            else:
                # 生产模式：使用TLS证书
                vault_cert_path = os.getenv('VAULT_CERT_PATH', '/usr/src/app/certs')
                server_cert = vault_cert_path + '/ca.pem'
                client_cert = vault_cert_path + '/cert.pem'
                client_key = vault_cert_path + '/key.pem'
                cls._instance.client = hvac.Client(url=vault_url, verify=server_cert, cert=(client_cert, client_key))
            
            #Trigger the renewal routine
            cls._instance.__login_with_app_role()
        return cls._instance

    def __login_with_app_role(self):
        print("Fetching token from vault")
        vault_role_id = os.getenv("VAULT_ROLE_ID")
        vault_secret_id = os.getenv("VAULT_SECRET_ID")
        login = self.client.auth.approle.login(
            role_id=vault_role_id,
            secret_id=vault_secret_id
        )
        self.__handle_token_renewal(login["auth"])

    def __renew_vault_token(self):
        print("Renewing vault token")
        renewed = self.client.auth.token.renew_self()
        self.__handle_token_renewal(renewed["auth"])

    def __handle_token_renewal(self, token):
        print(f"Got token with {token['lease_duration']}s remaining lease")
        refresh_time_seconds = token["lease_duration"] - 60
        if (token["renewable"] == True and refresh_time_seconds > 0):
            print(f"Will refresh token in {refresh_time_seconds}s.")
            Timer(refresh_time_seconds, self.__renew_vault_token).start()
        else:
            print(f"Will reauthenticate in {refresh_time_seconds}s.")
            Timer(refresh_time_seconds, self.__login_with_app_role).start()

    def get_secret(self, key):
        try:
            read_response = self.client.secrets.kv.read_secret_version(mount_point='gitlab', path=key)
            if (read_response):
                return read_response['data']['data']
            else:
                return None
        except Exception as e:
            current_app.logger.error(e)
            return None

    def put_secret(self, key, value):
        create_response = self.client.secrets.kv.v2.create_or_update_secret(mount_point='gitlab', path=key, secret=value)
        return create_response


    def delete_secret(self, key):
        delete_response = self.client.secrets.kv.v2.delete_metadata_and_all_versions(mount_point='gitlab', path=key)
        return delete_response
