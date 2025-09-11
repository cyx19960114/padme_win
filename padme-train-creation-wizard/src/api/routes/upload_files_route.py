import json
import os

from flask import Blueprint, request, jsonify, make_response
from werkzeug.exceptions import HTTPException, BadRequest, InternalServerError

from api.services import UploadFilesService
from api.util import constants

upload_files_page = Blueprint("upload_files", __name__)


def check_request_json():
    if not request.json:
        raise BadRequest(constants.ERROR_INVALID_JSON)


@upload_files_page.route("/upload/task", methods=["POST"])
def import_data_analysis_task():
    # check if the post request has the file part
    if 'file' not in request.files:
        return make_response(jsonify(
            message=constants.ERROR_FILE_NOT_FOUND_IN_REQUEST_DATA
        ), BadRequest.code)

    file = request.files['file']
    train_type = request.form.get('train_type')

    try:
        # Upload data analysis task to a directory
        data_file = UploadFilesService.save_data_analysis_file(file)

        # Create dummy connection credentials, metadata and git info JSONs
        UploadFilesService.create_connection_credentials_file(data_file.id)
        UploadFilesService.create_metadata_file(data_file.id, train_type)
        UploadFilesService.create_git_commit_info_file(data_file.id)
        return jsonify(
            message=constants.MESSAGE_DATA_ANALYSIS_UPLOAD_SUCCESS,
            train_id=data_file.id,
            file_type=data_file.fileType
        )
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


@upload_files_page.route("/upload/req-file/<string:train_id>", methods=["POST"])
def import_requirements(train_id):
    # check if the post request has the file part
    if 'file' not in request.files:
        return make_response(jsonify(
            message=constants.ERROR_FILE_NOT_FOUND_IN_REQUEST_REQ
        ), BadRequest.code)

    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    file = request.files['file']

    try:
        req_file_ext, req_file_name = UploadFilesService.save_req_file(file, train_id)
        return jsonify(
            message=constants.MESSAGE_REQ_UPLOAD_SUCCESS,
            train_id=train_id,
            file_name=req_file_name + "." + req_file_ext
        )
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


@upload_files_page.route("/upload/dockerfile/<string:train_id>", methods=["POST"])
def import_dockerfile(train_id):
    # check if the post request has the file part
    if 'file' not in request.files:
        return make_response(jsonify(
            message=constants.ERROR_FILE_NOT_FOUND_IN_REQUEST_DOCKERFILE
        ), BadRequest.code)

    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    file = request.files['file']

    try:
        dockerfile = UploadFilesService.save_docker_file(file, train_id)
        return jsonify(
            message=constants.MESSAGE_DOCKERFILE_UPLOAD_SUCCESS,
            train_id=train_id,
            file_name=dockerfile
        )
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


@upload_files_page.route("/upload/<string:train_id>", methods=["DELETE"])
def delete_train_image(train_id):
    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        UploadFilesService.cancel_train_image_creation(train_id)
        return jsonify(
            message=constants.MESSAGE_CANCEL_TRAIN_IMAGE_SUCCESS,
            train_id=train_id,
        )
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


@upload_files_page.route("/upload/template-dockerfile/<string:train_id>", methods=["GET"])
def get_dockerfile_content(train_id):
    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        args = request.args
        custom_file_flag = args.get("custom_file")
        if args.get("py_main") is None or args.get("py_main") == "":
            py_main_file = None
        else:
            py_main_file = args.get("py_main")
        dockerfile_content = UploadFilesService.get_docker_file_content(train_id, py_main_file, custom_file_flag)
        return jsonify(
            message=constants.MESSAGE_DOCKERFILE_FROM_TEMPLATE_UPLOAD_SUCCESS,
            train_id=train_id,
            docker_file_content=dockerfile_content
        )
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


@upload_files_page.route("/upload/template-dockerfile/<string:train_id>", methods=["POST"])
def create_dockerfile_from_template(train_id):
    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        check_request_json()
        UploadFilesService.save_docker_file_from_template(train_id, request.json)
        return jsonify(
            message=constants.MESSAGE_DOCKERFILE_FROM_TEMPLATE_SAVE_SUCCESS
        )
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


@upload_files_page.route("/upload/task/entrypoint/<string:train_id>", methods=["GET"])
def get_file_names_for_entry_point(train_id):
    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        file_names_entry_point = UploadFilesService.get_file_names_entry_point(train_id)
        return make_response(json.dumps(file_names_entry_point))
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
