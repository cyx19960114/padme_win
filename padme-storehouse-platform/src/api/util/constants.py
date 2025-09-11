import os

# Messages
ERROR_FILE_NOT_FOUND_IN_REQUEST = "'file' not found in request body"
ERROR_INVALID_FILE = "Invalid file"
ERROR_INVALID_JSON = "The JSON is invalid"
ERROR_LOGOFF = "Logoff failed due to an OSError!!! Try again or close the browser session."
SUCCESS_LOGOFF = "Logoff successful"
SUCCESS_VERIFY = "User is verified"
ERROR_VERIFY = "User is not verified / not logged in"

# Git Info
GITLAB_PADME_GROUP_ID = os.getenv("GITLAB_GROUP_ID")
GITLAB_PUBLIC_PHT_STORE_ID = os.getenv("GITLAB_STORE_ID")
OFFICIAL_GIT_DOMAIN = os.getenv("GITLAB_URL")
QUERY_PARAM_PER_PAGE = 150
GIT_TREE_DIRECTORY_MODE = "040000"
ACTIVE_GIT_PROJECT_USER_LABEL = "active"
OFFICIAL_TRAIN_STORE_GIT_SUB_FOLDER_URL = os.getenv("GITLAB_STORE_SUBFOLDER_URL")
OFFICIAL_TRAIN_STORE_MAIN_BRANCH = os.getenv("GITLAB_STORE_MAIN_BRANCH")
STANDARD_COMMIT_MESSAGE_FOR_FEEDBACK_FILE = "add user rating and feedback"
GITLAB_PUBLIC_FEDERATED_STORE_ID = os.getenv("GITLAB_FEDERATED_STORE_ID")
OFFICIAL_FEDERATED_STORE_GIT_SUB_FOLDER_URL = os.getenv("GITLAB_FEDERATED_STORE_SUBFOLDER_URL")

# File Names
TRAIN_CONNECTION_PARAMS_ENCODED_FILE = "%2Ftrain%5Fconnection%5Fcredentials%2Ejson"
TRAIN_METADATA_ENCODED_FILE = "%2Ftrain%5Fmetadata%2Ejson"
TRAIN_FEEDBACK_RATINGS_ENCODED_FILE = "%2Ftrain%5Fratings%5Ffeedback%2Ejson"
TRAIN_FEEDBACK_RATINGS_FILE_NAME = "train_ratings_feedback.json"
TEMPORARY_CREDS = "temporary_creds.json"

# Response Keys
RESPONSE_PROJECT_NAME = "project_name"
RESPONSE_CONNECTION_PARAMS = "connection_params"
RESPONSE_METADATA = "metadata"
RESPONSE_FEEDBACK = "feedback"
RESPONSE_PROJECT_URL = "project_url"
RESPONSE_BRANCH_NAME = "branch_name"
RESPONSE_MEMBER_NAME = "member_name"
RESPONSE_APPROVAL_PERMISSION = "approval_permission"
RESPONSE_FEEDBACK_PERMISSION = "feedback_permission"

KC_USERINFO_URL = os.getenv("KC_USERINFO_URL")
