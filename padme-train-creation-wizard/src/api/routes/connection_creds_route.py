from flask import Blueprint, request, jsonify, make_response
from werkzeug.exceptions import HTTPException, BadRequest, InternalServerError

from api.util import constants
from api.services import ConnectionCredentialsService
from api.services import UploadFilesService

ResponseJsonKeys = constants.ConnectionCredsResponseJsonKeys
RequestJsonKeys = constants.ConnectionCredsRequestJsonKeys

connection_creds_route = Blueprint("connection_creds", __name__)


def check_request_json():
    if not request.json or RequestJsonKeys.connection_params not in request.json:
        raise BadRequest(constants.ERROR_INVALID_CONNECTION_CREDENTIALS_JSON)


@connection_creds_route.route("/connection-creds/<string:train_id>", methods=["GET"])
def get_connection_credentials(train_id):
    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        connection_credentials_service = ConnectionCredentialsService(train_id)
        connection_credentials = connection_credentials_service.get_connection_credentials()

        result = {ResponseJsonKeys.train_id: train_id,
                  ResponseJsonKeys.connection_params: connection_credentials}

        return make_response(result)

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


@connection_creds_route.route("/connection-creds/<string:train_id>", methods=["POST"])
def save_connection_credentials(train_id):
    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        check_request_json()
        connection_credentials_service = ConnectionCredentialsService(train_id)
        connection_params = request.json[RequestJsonKeys.connection_params]

        saved_credentials = connection_credentials_service.save_connection_credentials(connection_params)

        result = {ResponseJsonKeys.train_id: train_id,
                  ResponseJsonKeys.connection_params: saved_credentials}

        return make_response(result)

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
