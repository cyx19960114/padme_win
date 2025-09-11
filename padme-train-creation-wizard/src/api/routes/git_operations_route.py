from flask import Blueprint, request, jsonify, make_response
from werkzeug.exceptions import HTTPException, BadRequest, InternalServerError

from api.services import GitOperationsService
from api.util import constants

git_operations_page = Blueprint("git_operations", __name__)


def check_request_json():
    if not request.json:
        raise BadRequest(constants.ERROR_INVALID_JSON)


@git_operations_page.route("/git-op/git-info/<string:train_id>", methods=["GET"])
def get_git_info(train_id):
    if not GitOperationsService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        git_info_response = GitOperationsService.get_git_info(train_id)
        return make_response(git_info_response)
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


@git_operations_page.route("/git-op/git-repo/<string:train_id>", methods=["POST"])
def upload_train_to_git(train_id):
    if not GitOperationsService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        upload_to_git_response = GitOperationsService.upload_pht_to_git(train_id)
        return make_response(upload_to_git_response)
    except HTTPException as exception:
        print(exception)
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        print(exp)
        message = exp.args[1]
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)


@git_operations_page.route("/git-op/git-branch/<string:train_id>", methods=["POST"])
def create_git_branch_and_save_commit_data(train_id):
    if not GitOperationsService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        check_request_json()
        info_json = GitOperationsService.create_branch_save_data(train_id, request.json)
        return make_response(info_json)
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


@git_operations_page.route("/git-op/private-git-info/<string:train_id>", methods=["POST"])
def save_private_git_details(train_id):
    if not GitOperationsService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        check_request_json()
        private_git_info = GitOperationsService.save_private_git_info(train_id, request.json)
        return make_response(private_git_info)
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


@git_operations_page.route("/git-op/private-git-info/<string:train_id>", methods=["GET"])
def get_private_git_details(train_id):
    if not GitOperationsService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        file_location, private_git_info = GitOperationsService.get_private_git_info(train_id)
        return make_response(private_git_info)
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
