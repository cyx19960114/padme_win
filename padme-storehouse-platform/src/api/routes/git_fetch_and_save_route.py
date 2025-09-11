import os

from flask import Blueprint, request, jsonify, make_response
from werkzeug.exceptions import HTTPException, BadRequest, InternalServerError

from api.services import GitFetchAndSaveService
from api.util import constants

git_fetch_and_save_page = Blueprint("git_fetch_and_save", __name__)


def check_request_json():
    if not request.json:
        raise BadRequest(constants.ERROR_INVALID_JSON)


@git_fetch_and_save_page.route("/gitlab/images/<string:train_store>/<string:branch_name>", methods=["GET"])
def fetch_git_repo_project_folders(train_store, branch_name):
    try:
        pat = request.headers.get("pat")
        git_repo_folders = GitFetchAndSaveService.get_train_images(train_store, branch_name, pat)
        return make_response(git_repo_folders)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = exp.args[1]
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)


@git_fetch_and_save_page.route("/gitlab/images/info", methods=["POST"])
def fetch_train_image_info():
    try:
        check_request_json()
        kc_username = request.headers.get("Username")
        pat = request.headers.get("pat")
        train_image_summary = GitFetchAndSaveService.get_train_image_info(request.json, kc_username, pat)
        return make_response(train_image_summary)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = exp.args[1]
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)


@git_fetch_and_save_page.route("/gitlab/branches/<string:train_store>", methods=["GET"])
def get_gitlab_branches(train_store):
    try:
        pat = request.headers.get("pat")
        git_branch_response = GitFetchAndSaveService.get_gitlab_project_branches(train_store, pat)
        return make_response(git_branch_response)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = exp.args[1]
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)


@git_fetch_and_save_page.route("/gitlab/images/<string:train_store>/<string:branch_name>/<string:train_image>", methods=["GET"])
def get_gitlab_folder_contents(train_store, branch_name, train_image):
    try:
        pat = request.headers.get("pat")
        git_folder_response = GitFetchAndSaveService.get_train_folder_content(train_store, branch_name, train_image, pat)
        return make_response(git_folder_response)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = exp.args[1]
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)


@git_fetch_and_save_page.route("/gitlab/save-feedback", methods=["POST"])
def save_user_feedback_to_git_project():
    try:
        check_request_json()
        pat = request.headers.get("pat")
        git_user_feedback_response, file_location = GitFetchAndSaveService.git_save_user_feedback(request.json, pat)
        os.remove(file_location)
        return make_response(git_user_feedback_response)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = exp.args[1]
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)


@git_fetch_and_save_page.route("/gitlab/merge-request", methods=["POST"])
def create_git_merge_request_pht():
    try:
        check_request_json()
        pat = request.headers.get("pat")
        git_mr_response = GitFetchAndSaveService.create_merge_request(request.json, pat)
        return make_response(git_mr_response)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = exp.args[1]
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)


@git_fetch_and_save_page.route("/gitlab/merge-request/merge", methods=["POST"])
def merge_git_merge_request():
    try:
        check_request_json()
        pat = request.headers.get("pat")
        git_mr_response = GitFetchAndSaveService.push_merge_request(request.json, pat)
        return make_response(git_mr_response)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = exp.args[1]
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)
