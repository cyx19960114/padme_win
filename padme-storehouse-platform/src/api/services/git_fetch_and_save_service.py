from flask import current_app
from werkzeug.exceptions import NotFound
import os
import requests
import json
import base64
import time
import datetime
from .vault_service import VaultService

from api.util import constants
from werkzeug.exceptions import BadRequest


class GitFetchAndSaveService:
    @staticmethod
    def get_temporary_feedback_file_location():
        file_location = os.path.join(
            current_app.config["TEMP_FOLDER"], constants.TRAIN_FEEDBACK_RATINGS_FILE_NAME
        )
        return file_location

    @staticmethod
    def get_user_info(kc_username):
        user_git_info = VaultService().get_secret(kc_username)
        return user_git_info

    @staticmethod
    def get_train_store_id(train_store):
        if train_store == 'federated-learning':
            store_id = constants.GITLAB_PUBLIC_FEDERATED_STORE_ID
        else:
            store_id = constants.GITLAB_PUBLIC_PHT_STORE_ID
        return store_id

    @staticmethod
    def get_train_store_url(train_store):
        if train_store == 'federated-learning':
            store_url = constants.OFFICIAL_FEDERATED_STORE_GIT_SUB_FOLDER_URL
        else:
            store_url = constants.OFFICIAL_TRAIN_STORE_GIT_SUB_FOLDER_URL
        return store_url

    @staticmethod
    def get_train_images(train_store, branch_name, pat):
        # Fetch train images using GitLab API (requests - repository tree) of main branch
        store_id = GitFetchAndSaveService.get_train_store_id(train_store)
        git_tree_headers = {"PRIVATE-TOKEN": pat}
        git_tree_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(
            store_id) + "/repository/tree?per_page=" + str(constants.QUERY_PARAM_PER_PAGE) + \
            "&ref=" + constants.OFFICIAL_TRAIN_STORE_MAIN_BRANCH

        git_tree_response = requests.get(git_tree_url, headers=git_tree_headers).json()
        tree_node_list = []
        for tree_node in git_tree_response:
            if tree_node['mode'] == constants.GIT_TREE_DIRECTORY_MODE:
                tree_node_list.append(tree_node['name'])

        # If main branch is selected => display all published train images
        # If non-main branch is selected => display only new train images in the non-main branch
        if branch_name == constants.OFFICIAL_TRAIN_STORE_MAIN_BRANCH:
            return json.dumps(tree_node_list)
        else:
            git_tree_branch_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(
                store_id) + "/repository/tree?per_page=" + str(
                constants.QUERY_PARAM_PER_PAGE) + "&ref=" + branch_name

            git_tree_branch_response = requests.get(git_tree_branch_url, headers=git_tree_headers).json()
            tree_node_branch_list = []
            for tree_node in git_tree_branch_response:
                if tree_node['mode'] == constants.GIT_TREE_DIRECTORY_MODE:
                    tree_node_branch_list.append(tree_node['name'])

            # tree_list_diff = [i for i in tree_node_branch_list + tree_node_list if i not in tree_node_branch_list or i not in tree_node_list]
            tree_list_diff = list(set(tree_node_branch_list) - set(tree_node_list))
            return json.dumps(tree_list_diff)

    @staticmethod
    def get_train_folder_content(train_store, branch_name, train_image, pat):
        store_id = GitFetchAndSaveService.get_train_store_id(train_store)
        git_tree_headers = {"PRIVATE-TOKEN": pat}
        git_tree_branch_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(
            store_id) + "/repository/tree?per_page=" + str(
            constants.QUERY_PARAM_PER_PAGE) + "&ref=" + branch_name + "&path=" + train_image
        git_tree_branch_response = requests.get(git_tree_branch_url, headers=git_tree_headers).json()
        tree_node_branch_list = []
        for tree_node in git_tree_branch_response:
            if tree_node['mode'] == constants.GIT_TREE_DIRECTORY_MODE:
                tree_node_branch_list.append(tree_node['name'])

        return json.dumps(tree_node_branch_list)

    @staticmethod
    def get_base64_decoded_content(encoded_content):
        try:
            # Safe Base64 Decoding
            safeDecodedBytes = base64.b64decode(encoded_content).decode('utf-8')
        except:
            safeDecodedBytes = ""

        return safeDecodedBytes

    @staticmethod
    def get_file_content(project_name, branch_name, file_encoded_name, store_id, image_type, pat):
        git_file_headers = {"PRIVATE-TOKEN": pat}
        git_file_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(
            store_id) + "/repository/files/" + project_name
        if (image_type):
            git_file_url = git_file_url + "%2F" + image_type
        git_file_url = git_file_url + file_encoded_name + "?ref=" + branch_name

        git_file_response = requests.get(git_file_url, headers=git_file_headers)
        if git_file_response.status_code == 200 or git_file_response.status_code == 201:
            base64_encoded_content = git_file_response.json()["content"]
            base64_decoded_content = GitFetchAndSaveService.get_base64_decoded_content(base64_encoded_content)
            return base64_decoded_content
        else:
            return ""

    @staticmethod
    def get_train_image_info(git_info_json, kc_username, pat):
        branch_name = git_info_json['branch_name']
        project_name = git_info_json['project_name']
        train_store = git_info_json['train_store']
        store_id = GitFetchAndSaveService.get_train_store_id(train_store)
        image_type = None
        if (train_store == 'federated-learning'):
            image_type = git_info_json['image_type']
        feedback_permission = True
        # Step 1: Get connection parameters
        connection_params = GitFetchAndSaveService.get_file_content(
            project_name, branch_name, constants.TRAIN_CONNECTION_PARAMS_ENCODED_FILE, store_id, image_type, pat)

        # Step 2: Get metadata
        metadata = GitFetchAndSaveService.get_file_content(
            project_name, branch_name, constants.TRAIN_METADATA_ENCODED_FILE, store_id, image_type, pat)

        # Step 3: Get feedback
        feedback_and_ratings = GitFetchAndSaveService.get_file_content(
            project_name, branch_name, constants.TRAIN_FEEDBACK_RATINGS_ENCODED_FILE, store_id, image_type, pat)

        user_git_info = GitFetchAndSaveService.get_user_info(kc_username)
        member_name = user_git_info["member_name"]
        access_level = user_git_info["access_level"]
        if access_level >= 40:
            approval_permission = True
        else:
            approval_permission = False

        # Step 4: Convert to JSON object
        if connection_params:
            connection_params = json.loads(connection_params)
        if metadata:
            metadata = json.loads(metadata)
        if feedback_and_ratings:
            feedback_and_ratings = json.loads(feedback_and_ratings)
            for feedback in feedback_and_ratings:
                if member_name == feedback['member_name']:
                    feedback_permission = False
                    break

        response_project_url = GitFetchAndSaveService.get_train_store_url(train_store) + branch_name + "/" + project_name
        if (image_type):
            response_project_url = response_project_url + "/" + image_type

        summary = {
            constants.RESPONSE_PROJECT_NAME: project_name,
            constants.RESPONSE_BRANCH_NAME: branch_name,
            constants.RESPONSE_MEMBER_NAME: member_name,
            constants.RESPONSE_CONNECTION_PARAMS: connection_params,
            constants.RESPONSE_METADATA: metadata,
            constants.RESPONSE_FEEDBACK: feedback_and_ratings,
            constants.RESPONSE_APPROVAL_PERMISSION: approval_permission,
            constants.RESPONSE_FEEDBACK_PERMISSION: feedback_permission,
            constants.RESPONSE_PROJECT_URL: response_project_url,
        }

        return summary

    @staticmethod
    def get_gitlab_project_branches(train_store, pat):
        store_id = GitFetchAndSaveService.get_train_store_id(train_store)
        git_branch_headers = {"PRIVATE-TOKEN": pat}
        git_branch_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(store_id) + "/repository/branches"

        git_branch_response = requests.get(git_branch_url, headers=git_branch_headers).json()
        branch_list = []
        for info in git_branch_response:
            branch_list.append(info['name'])

        return json.dumps(branch_list)

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
    def git_save_user_feedback(user_feedback_json, pat):
        branch_name = user_feedback_json['branch_name']
        project_name = user_feedback_json['project_name']
        member_name = user_feedback_json['member_name']
        train_store = user_feedback_json['train_store']
        store_id = GitFetchAndSaveService.get_train_store_id(train_store)
        image_type = None
        if (train_store == 'federated-learning'):
            image_type = user_feedback_json['image_type']
        # Fetch user feedback json from git
        feedback_and_ratings = GitFetchAndSaveService.get_file_content(
            project_name, branch_name, constants.TRAIN_FEEDBACK_RATINGS_ENCODED_FILE, store_id, image_type, pat)

        file_exists_flag = False
        time_now = datetime.datetime.now().strftime("%I:%M %p on %B %d, %Y")
        if feedback_and_ratings:
            # Append to already existing json
            feedback_and_ratings = json.loads(feedback_and_ratings)
            user_feedback_file = feedback_and_ratings
            user_feedback_file.append({
                "member_name": member_name,
                "rating": user_feedback_json['rating'],
                "comment": user_feedback_json['comment'],
                "date_time": time_now
            })
            file_exists_flag = True
        else:
            # Form new user feedback json
            user_feedback_file = [
                {
                    "member_name": member_name,
                    "rating": user_feedback_json['rating'],
                    "comment": user_feedback_json['comment'],
                    "date_time": time_now
                }
            ]

        # Save feedback file temporarily
        file_location = GitFetchAndSaveService.get_temporary_feedback_file_location()
        with open(file_location, "w") as outfile:
            json.dump(user_feedback_file, outfile)

        # Do a git commit
        actions_list = []
        action_dict = {}
        base64EncodedContent = GitFetchAndSaveService.get_base64_encoding_content(file_location)
        if file_exists_flag:
            action_dict["action"] = "update"
        else:
            action_dict["action"] = "create"
        file_path = project_name + "/"
        if (image_type):
            file_path = file_path + image_type + "/"
        file_path = file_path + constants.TRAIN_FEEDBACK_RATINGS_FILE_NAME
        action_dict["file_path"] = file_path
        action_dict["content"] = base64EncodedContent
        action_dict["encoding"] = "base64"
        actions_list.append(action_dict)

        commit_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(store_id) + "/repository/commits"
        commit_headers = {
            "PRIVATE-TOKEN": pat,
            "Content-Type": "application/json",
            "Accept-Charset": "UTF-8"
        }

        commit_data = {
            "branch": branch_name,
            "commit_message": constants.STANDARD_COMMIT_MESSAGE_FOR_FEEDBACK_FILE,
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
            return response_dict, file_location
        else:
            commit_response_error_message = commit_response.json()
            raise BadRequest(commit_response_error_message['message'])

    @staticmethod
    def create_merge_request(mr_request_json, pat):
        mr_title = mr_request_json['mr_title']
        src_branch = mr_request_json['branch_name']
        train_store = mr_request_json['train_store']
        store_id = GitFetchAndSaveService.get_train_store_id(train_store)
        # Create a git merge request
        merge_request_headers = {"PRIVATE-TOKEN": pat}
        merge_request_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(
            store_id) + "/merge_requests?source_branch=" + src_branch + "&target_branch=" + \
            constants.OFFICIAL_TRAIN_STORE_MAIN_BRANCH + "&title=" + mr_title

        merge_request_response = requests.post(merge_request_url, headers=merge_request_headers)
        if merge_request_response.status_code == 201 or merge_request_response.status_code == 200:
            merge_request_response_content = merge_request_response.json()
            time.sleep(5)

            # Get pipeline URL from GitLab
            pipeline_headers = {"PRIVATE-TOKEN": pat}
            pipeline_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(store_id) + "/pipelines"
            pipeline_response = requests.get(pipeline_url, headers=pipeline_headers).json()

            if (len(pipeline_response) > 0):
                pipeline_url = pipeline_response[0]['web_url']

            response_dict = {
                "mr_iid": merge_request_response_content['iid'],
                "mr_title": merge_request_response_content['title'],
                "mr_state": merge_request_response_content['state'],
                "mr_created_at": merge_request_response_content['created_at'],
                "mr_source_branch": merge_request_response_content['source_branch'],
                "mr_target_branch": merge_request_response_content['target_branch'],
                "mr_url": merge_request_response_content['web_url'],
                "pipeline_url": pipeline_url
            }
            return response_dict
        else:
            commit_response_error_message = merge_request_response.json()
            raise BadRequest(commit_response_error_message['message'])

    @staticmethod
    def push_merge_request(mr_json, pat):
        mr_iid = mr_json['mr_iid']
        train_store = mr_json['train_store']
        store_id = GitFetchAndSaveService.get_train_store_id(train_store)
        # Merge a git merge request
        mr_push_headers = {"PRIVATE-TOKEN": pat}
        mr_push_url = constants.OFFICIAL_GIT_DOMAIN + "/api/v4/projects/" + str(
            store_id) + "/merge_requests/" + str(mr_iid) + \
            "/merge?should_remove_source_branch=true"

        mr_push_response = requests.put(mr_push_url, headers=mr_push_headers)
        if mr_push_response.status_code == 201 or mr_push_response.status_code == 200 or mr_push_response.status_code == 204:
            mr_push_response_content = mr_push_response.json()
            time.sleep(2)
            response_dict = {
                "mr_push_created_at": mr_push_response_content['created_at'],
                "mr_push_url": mr_push_response_content['web_url']
            }
            return response_dict
        else:
            mr_push_error_message = mr_push_response.json()
            raise BadRequest(mr_push_error_message['message'])
