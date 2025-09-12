from flask import Blueprint, request, jsonify, make_response
from werkzeug.exceptions import HTTPException, BadRequest, InternalServerError
from api.util import constants
from api.services import AuthenticationService

authentication_route = Blueprint("authentication", __name__)


def check_request_json():
    if not request.json:
        raise BadRequest(constants.ERROR_INVALID_JSON)


@authentication_route.route("/authentication/login", methods=["POST"])
def login():
    try:
        check_request_json()
        kc_username = request.headers.get("Username")
        username = request.json['username']
        pat = request.json['pat']
        login_response = AuthenticationService.authenticate_username_pat(username, pat, kc_username)
        return make_response(login_response)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = str(exp) if exp.args else "Unknown error occurred"
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)


@authentication_route.route("/authentication/revoke", methods=["DELETE"])
def revoke():
    try:
        kc_username = request.headers.get("Username")
        revoke_response = AuthenticationService.revoke_token(kc_username)
        return make_response(revoke_response)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = str(exp) if exp.args else "Unknown error occurred"
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)


@authentication_route.route("/authentication/verify", methods=["GET"])
def verify():
    try:
        kc_username = request.headers.get("Username")
        login_message = AuthenticationService.verify_user(kc_username)
        return make_response(login_message)
    except HTTPException as exception:
        message = exception.description
        status_code = exception.code
        return make_response(jsonify(
            message=message
        ), status_code)
    except Exception as exp:
        message = str(exp) if exp.args else "Unknown error occurred"
        return make_response(jsonify(
            message=message
        ), InternalServerError.code)
