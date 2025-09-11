from flask import Blueprint, request, jsonify, make_response
from werkzeug.exceptions import HTTPException, BadRequest, InternalServerError

from api.services import AuthenticationAuthorizationService
from api.util import constants

authn_authz_page = Blueprint("authn_authz", __name__)


def check_request_json():
    if not request.json:
        raise BadRequest(constants.ERROR_INVALID_JSON)


@authn_authz_page.route("/authentication", methods=["POST"])
def authenticate_user_with_pat():
    try:
        check_request_json()
        kc_username = request.headers.get("Username")
        username = request.json['username']
        pat = request.json['pat']
        login_message = AuthenticationAuthorizationService.authenticate_username_pat(username, pat, kc_username)
        return make_response(login_message)
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


@authn_authz_page.route("/authentication/revoke", methods=["DELETE"])
def revoke_user_credentials():
    try:
        kc_username = request.headers.get("Username")
        login_message = AuthenticationAuthorizationService.revoke_token(kc_username)
        return make_response(login_message)
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


@authn_authz_page.route("/authentication/verify", methods=["GET"])
def verify_user():
    try:
        kc_username = request.headers.get("Username")
        login_message = AuthenticationAuthorizationService.verify_user(kc_username)
        return make_response(login_message)
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
