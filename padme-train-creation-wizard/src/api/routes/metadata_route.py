from flask import Blueprint, request, jsonify, make_response
from werkzeug.exceptions import HTTPException, BadRequest, InternalServerError

from api.util import constants
from api.services import MetadataService
from api.services import UploadFilesService

metadata_route = Blueprint("metadata", __name__)


def check_request_json():
    if not request.json:
        raise BadRequest(constants.ERROR_INVALID_METADATA_JSON)


@metadata_route.route("/metadata/<string:train_id>", methods=["GET"])
def get_metadata(train_id):
    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        metadata_service = MetadataService(train_id)
        metadata = metadata_service.get_metadata()
        metadata[constants.TRAIN_ID] = train_id

        return make_response(metadata)

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


@metadata_route.route("/metadata/<string:train_id>", methods=["POST"])
def save_metadata(train_id):
    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        check_request_json()
        metadata_service = MetadataService(train_id)
        saved_metadata = metadata_service.save_metadata(request.json)

        return make_response(saved_metadata)

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

