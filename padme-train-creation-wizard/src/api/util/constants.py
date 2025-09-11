import os

# Error messages
ERROR_FILE_NOT_FOUND_IN_REQUEST_DATA = "Data analysis task file not found in request body"
ERROR_FILE_NOT_FOUND_IN_REQUEST_REQ = "Requirements file not found in request body"
ERROR_FILE_NOT_FOUND_IN_REQUEST_DOCKERFILE = "Dockerfile not found in request body"
ERROR_INVALID_FILE = "Invalid file"
ERROR_EMPTY_FILE = "Empty file"
ERROR_TRAIN_ID_DOESNT_EXIST = "A train image with the provided ID does not exist"
ERROR_INVALID_CONNECTION_CREDENTIALS_JSON = "The connection credentials JSON is invalid"
ERROR_INVALID_METADATA_JSON = "The metadata JSON is invalid"
ERROR_INVALID_JSON = "The JSON is invalid"
ERROR_ACCESS_TOKEN_INVALID = "The personal access token is invalid. " \
                             "Please 'Cancel' this train creation process and try again with a valid access token."
GENERAL_GITLAB_API_ERROR = ". Resolve the error, finish/cancel the ongoing process and try again!!!"
ERROR_VERIFY = "User is not verified / not logged in"
ERROR_LOGOFF = "Logoff failed due to an OSError!!! Try again or close the browser session."

# Messages
MESSAGE_DATA_ANALYSIS_UPLOAD_SUCCESS = "Data analysis task uploaded successfully"
MESSAGE_REQ_UPLOAD_SUCCESS = "Requirements uploaded successfully"
MESSAGE_DOCKERFILE_UPLOAD_SUCCESS = "Dockerfile uploaded successfully"
MESSAGE_DOCKERFILE_FROM_TEMPLATE_UPLOAD_SUCCESS = "Dockerfile generated from template successfully"
MESSAGE_DOCKERFILE_FROM_TEMPLATE_SAVE_SUCCESS = "Dockerfile saved from template successfully"
MESSAGE_CANCEL_TRAIN_IMAGE_SUCCESS = "Train image creation cancelled successfully"
MESSAGE_UPLOAD_TRAIN_IMAGE_GIT_SUCCESS = "Train image has been uploaded to GitLab repo successfully"
MESSAGE_SUCCESS_LOGOFF = "Logoff successful"
MESSAGE_SUCCESS_VERIFY = "User is verified"

# File extension constants
PYTHON_EXTENSION = "py"
R_EXTENSION = "R"
R_SMALL_EXTENSION = "r"
R_DATA_EXTENSION = "rdata"
ZIP_EXTENSION = "zip"
SEVEN_ZIP_EXTENSION = "7z"
TXT_EXTENSION = "txt"
DOCKER_FILE = "Dockerfile"
ALLOWED_EXTENSIONS = {PYTHON_EXTENSION, R_EXTENSION, ZIP_EXTENSION, SEVEN_ZIP_EXTENSION, R_DATA_EXTENSION, R_SMALL_EXTENSION}
ALLOWED_EXTENSIONS_REQ = {R_EXTENSION, TXT_EXTENSION, R_SMALL_EXTENSION}
ALLOWED_DOCKER_FILE_NAME = {DOCKER_FILE}
DOCKERFILE_TEMPLATE_NAME_PYTHON = "Dockerfile-template-python"
DOCKERFILE_TEMPLATE_NAME_R = "Dockerfile-template-R"
JSON_FILE_EXTENSION = "json"
ENV_VAR_LABEL_DOCKERFILE = 'LABEL envs="{env_variables_info}"'

# File names
TRAIN_CONNECTION_CREDENTIALS = "train_connection_credentials.json"
TRAIN_METADATA = "train_metadata.json"
PRIVATE_GIT_INFO = "private_git_info.json"
TRAIN_ID = "train_id"

GITLAB_PADME_GROUP_ID = os.getenv("GITLAB_GROUP_ID")
GITLAB_PUBLIC_PHT_STORE_ID = os.getenv("GITLAB_STORE_ID")
OFFICIAL_GIT_DOMAIN = os.getenv("GITLAB_URL")
OFFICIAL_TRAIN_STORE_GIT_URL = os.getenv("GITLAB_STORE_URL")
GITLAB_MAIN_BRANCH = os.getenv("GITLAB_STORE_MAIN_BRANCH")
QUERY_PARAM_PER_PAGE = 150
ACTIVE_GIT_PROJECT_USER_LABEL = "active"
GITLAB_PUBLIC_FEDERATED_STORE_ID = os.getenv("GITLAB_FEDERATED_STORE_ID")
OFFICIAL_FEDERATED_TRAIN_STORE_GIT_URL = os.getenv("GITLAB_FEDERATED_STORE_URL")
# Train Types
FEDERATED_LEARNING = "federated-learning"
FEDERATED_AGGREGATION = "federated-aggregation"
KC_USERINFO_URL = os.getenv("KC_USERINFO_URL")


class ConnectionCredsResponseJsonKeys:
    train_id = "train_id"
    connection_params = "connection_params"
    metadata = "metadata"
    data_files = "data_files"


class ConnectionCredsRequestJsonKeys:
    connection_params = "connection_params"
