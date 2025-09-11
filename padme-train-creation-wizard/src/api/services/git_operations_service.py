from flask import current_app
from werkzeug.exceptions import NotFound, BadRequest, UnsupportedMediaType
from werkzeug.utils import secure_filename
import os
import json
import requests
import base64
import time
from os import listdir
from os.path import isfile, join

from api.util import constants


class GitOperationsService:
    @staticmethod
    def _gen_path_without_filename(train_id):
        base_path = os.path.join(current_app.config["UPLOAD_FOLDER"], train_id)
        return base_path

    @staticmethod
    def is_train_id_feasible(train_id):
        path = os.path.join(current_app.config['UPLOAD_FOLDER'], train_id)
        return os.path.exists(path)

    @staticmethod
    def get_metadata_file_location(train_id):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.TRAIN_METADATA
        )
        return file_location

    @staticmethod
    def get_private_git_info_file_location(train_id):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.PRIVATE_GIT_INFO
        )
        return file_location

    @staticmethod
    def get_project_directory_name(train_id):
        metadata_file_location = GitOperationsService.get_metadata_file_location(train_id)
        with open(metadata_file_location) as infile:
            metadata = json.load(infile)
        project_directory_name = metadata["project_name"]
        train_type = metadata["additional_info"]["train_type"]
        if train_type == constants.FEDERATED_LEARNING:
            project_directory_name = project_directory_name + "/learning"
        elif train_type == constants.FEDERATED_AGGREGATION:
            project_directory_name = project_directory_name + "/aggregation"
        return project_directory_name

    @staticmethod
    def get_project_access_type(train_id):
        metadata_file_location = GitOperationsService.get_metadata_file_location(train_id)
        with open(metadata_file_location) as infile:
            metadata = json.load(infile)
        project_type = metadata["project_type"]
        return project_type

    @staticmethod
    def get_public_store_id(train_id):
        metadata_file_location = GitOperationsService.get_metadata_file_location(train_id)
        with open(metadata_file_location) as infile:
            metadata = json.load(infile)
        train_type = metadata["additional_info"]["train_type"]
        if train_type == constants.FEDERATED_LEARNING or train_type == constants.FEDERATED_AGGREGATION:
            pht_store_id = constants.GITLAB_PUBLIC_FEDERATED_STORE_ID
        else:
            pht_store_id = constants.GITLAB_PUBLIC_PHT_STORE_ID
        return pht_store_id

    @staticmethod
    def get_private_git_info(train_id):
        private_git_info_file_location = GitOperationsService.get_private_git_info_file_location(train_id)
        with open(private_git_info_file_location) as infile:
            private_git_info = json.load(infile)

        return private_git_info_file_location, private_git_info

    @staticmethod
    def get_user_pat(train_id):
        private_git_info_file_location = GitOperationsService.get_private_git_info_file_location(train_id)
        with open(private_git_info_file_location) as infile:
            private_git_info = json.load(infile)

        pat = private_git_info["access_token"]
        return pat

    @staticmethod
    def get_base64_encoding_content(pht_filename):
        try:
            with open(pht_filename, "r") as pht_file:
                file_content = pht_file.read()
        # except UnicodeDecodeError: TODO csv reader
        #    with open(pht_filename, "r") as pht_file:
        #        file_content = csv.reader(pht_file)
        except:
            file_content = ""

        # Safe Base64 Encoding
        urlSafeEncodedBytes = base64.b64encode(file_content.encode("utf-8"))
        urlSafeEncodedStr = str(urlSafeEncodedBytes, "utf-8")

        return urlSafeEncodedStr

    @staticmethod
    def get_trimmed_git_dir_file_name(train_id, pht_file):
        split_strings = pht_file.split(train_id, 1)
        return split_strings[1].replace("\\", "/")

    @staticmethod
    def cleanup_zip_file(train_id):
        global zip_task_file
        zip_flag = False
        base_location = GitOperationsService._gen_path_without_filename(train_id)
        all_data_files = [f for f in listdir(base_location) if isfile(join(base_location, f))]
        for file in all_data_files:
            if file.endswith(constants.ZIP_EXTENSION) or file.endswith(constants.SEVEN_ZIP_EXTENSION):
                zip_task_file = file
                zip_flag = True
                break

        if zip_flag:
            zip_task_file_location = os.path.join(base_location, zip_task_file)
            os.remove(zip_task_file_location)
            time.sleep(2)

    @staticmethod
    def upload_pht_to_git(train_id):
        # Get the project directory name and project access type
        project_directory_name = GitOperationsService.get_project_directory_name(train_id)
        project_type = GitOperationsService.get_project_access_type(train_id)
        private_file_location, git_info = GitOperationsService.get_private_git_info(train_id)

        # Remove the pat file
        os.remove(private_file_location)
        time.sleep(2)

        # Remove the zip file
        GitOperationsService.cleanup_zip_file(train_id)

        base_location = GitOperationsService._gen_path_without_filename(train_id)
        all_data_files = []
        for root, dirs, files in os.walk(base_location):
            for name in files:
                filePath = os.path.abspath(os.path.join(root, name))
                all_data_files.append(filePath)

        actions_list = []
        for pht_file in all_data_files:
            action_dict = {}
            base64EncodedContent = GitOperationsService.get_base64_encoding_content(pht_file)
            action_dict["action"] = "create"
            git_dir_file_name = GitOperationsService.get_trimmed_git_dir_file_name(train_id, pht_file)
            action_dict["file_path"] = project_directory_name + git_dir_file_name
            action_dict["content"] = base64EncodedContent
            action_dict["encoding"] = "base64"
            actions_list.append(action_dict)

        # Create a git commit to the main public branch: PHT Train Images Storehouse or private branch
        if project_type == "Public":
            store_id = GitOperationsService.get_public_store_id(train_id)
            commit_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(store_id) + "/repository/commits"
            commit_headers = {
                "PRIVATE-TOKEN": git_info["access_token"],
                "Content-Type": "application/json",
                "Accept-Charset": "UTF-8"
            }
        else:
            commit_url = git_info["git_url"] + "/api/v4/projects/" + str(git_info["project_id"]) + "/repository/commits"
            commit_headers = {
                "PRIVATE-TOKEN": git_info["access_token"],
                "Content-Type": "application/json",
                "Accept-Charset": "UTF-8"
            }

        if git_info["new_branch"]:
            commit_branch = git_info["new_branch_name"]
        else:
            commit_branch = git_info["branch"]

        commit_data = {
            "branch": commit_branch,
            "commit_message": git_info['commit_message'],
            "actions": actions_list
        }

        commit_response = requests.post(commit_url, headers=commit_headers, data=json.dumps(commit_data))

        if commit_response.status_code == 201 or commit_response.status_code == 200:
            commit_response_content = commit_response.json()
            time.sleep(2)
            response_dict = {
                "commit_message": commit_response_content['title'],
                "commit_created_at": commit_response_content['created_at'],
                "commit_url": commit_response_content['web_url'],
                "author_name": commit_response_content['author_name'],
                "commit_sha": commit_response_content['short_id']
            }
            return response_dict
        else:
            commit_response_error_message = commit_response.json()
            raise BadRequest(commit_response_error_message['message'] + constants.GENERAL_GITLAB_API_ERROR)

    @staticmethod
    def get_git_info(train_id):
        project_type = GitOperationsService.get_project_access_type(train_id)
        if project_type == "Public":
            pat = GitOperationsService.get_user_pat(train_id)
            info_headers = {"PRIVATE-TOKEN": pat}
            store_id = GitOperationsService.get_public_store_id(train_id)
            info_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(store_id) + "/repository/branches"
        else:
            private_file_location, git_info = GitOperationsService.get_private_git_info(train_id)
            info_headers = {"PRIVATE-TOKEN": git_info["access_token"]}
            info_url = git_info["git_url"] + "/api/v4/projects/" + str(git_info["project_id"]) + "/repository/branches"

        git_info_response = requests.get(info_url, headers=info_headers).json()
        branch_list = []
        for info in git_info_response:
            try:
                branch_list.append(info['name'])
            except (TypeError, IndexError) as e:
                raise BadRequest(constants.ERROR_ACCESS_TOKEN_INVALID)

        # Remove 'main' branch from list to avoid commits to main branch
        if constants.GITLAB_MAIN_BRANCH in branch_list:
            branch_list.remove(constants.GITLAB_MAIN_BRANCH)

        return json.dumps(branch_list)

    @staticmethod
    def save_private_git_info(train_id, json_request):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.PRIVATE_GIT_INFO
        )

        with open(file_location, "r") as jsonFile:
            git_info_json = json.load(jsonFile)

        git_info_json["git_url"] = json_request['git_url']
        git_info_json["project_id"] = json_request['project_id']
        git_info_json["access_token"] = json_request['access_token']

        with open(file_location, "w") as outfile:
            json.dump(git_info_json, outfile)

        return git_info_json

    @staticmethod
    def create_branch_save_data(train_id, branch_commit_info):
        new_branch_flag = branch_commit_info['new_branch']
        # Create a new branch
        if new_branch_flag:
            project_type = GitOperationsService.get_project_access_type(train_id)
            if project_type == "Public":
                pat = GitOperationsService.get_user_pat(train_id)
                create_branch_headers = {"PRIVATE-TOKEN": pat}
                store_id = GitOperationsService.get_public_store_id(train_id)
                create_branch_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(
                    store_id) + "/repository/branches?branch=" + \
                    branch_commit_info['new_branch_name'] + "&ref=" + constants.GITLAB_MAIN_BRANCH
            else:
                private_file_location, git_info = GitOperationsService.get_private_git_info(train_id)
                create_branch_headers = {"PRIVATE-TOKEN": git_info["access_token"]}
                create_branch_url = git_info["git_url"] + "/api/v4/projects/" + str(
                    git_info["project_id"]) + "/repository/branches?branch=" + \
                    branch_commit_info['new_branch_name'] + "&ref=" + constants.GITLAB_MAIN_BRANCH

            create_branch_info_response = requests.post(create_branch_url, headers=create_branch_headers).json()
            time.sleep(4)

        # Save branch and commit message
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.PRIVATE_GIT_INFO
        )

        with open(file_location, "r") as jsonFile:
            git_info_json = json.load(jsonFile)

        git_info_json["new_branch_name"] = branch_commit_info['new_branch_name']
        git_info_json["branch"] = branch_commit_info['branch']
        git_info_json["new_branch"] = branch_commit_info['new_branch']
        git_info_json["commit_message"] = branch_commit_info['commit_message']

        with open(file_location, "w") as outfile:
            json.dump(git_info_json, outfile)

        return git_info_json
