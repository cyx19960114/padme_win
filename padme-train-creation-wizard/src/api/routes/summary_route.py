from flask import Blueprint, jsonify, make_response
from werkzeug.exceptions import HTTPException, BadRequest, InternalServerError

from api.util import constants
from api.services import SummaryService
from api.services import UploadFilesService

ResponseJsonKeys = constants.ConnectionCredsResponseJsonKeys
RequestJsonKeys = constants.ConnectionCredsRequestJsonKeys

summary_route = Blueprint("summary", __name__)


@summary_route.route("/summary/<string:train_id>", methods=["GET"])
def get_summary(train_id):
    if not UploadFilesService.is_train_id_feasible(train_id):
        return make_response(
            jsonify(message=constants.ERROR_TRAIN_ID_DOESNT_EXIST), BadRequest.code
        )

    try:
        summary_service = SummaryService(train_id)
        summary = summary_service.get_summary()

        result = {ResponseJsonKeys.train_id: train_id,
                  ResponseJsonKeys.connection_params: summary[ResponseJsonKeys.connection_params],
                  ResponseJsonKeys.metadata: summary[ResponseJsonKeys.metadata],
                  ResponseJsonKeys.data_files: summary[ResponseJsonKeys.data_files]}

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
