from flask import Flask, request, abort
from flask.blueprints import Blueprint
import os

import config
import api.routes as api_routes
import wapp.route as wapp_page
import werkzeug
from api.services import KeycloakService, VaultService

app = Flask(__name__, static_url_path="/wapp/", template_folder=config.FLASK_TEMPLATES_FOLDER)

app.debug = config.DEBUG
app.config["DATA_FOLDER"] = os.path.join(app.root_path, config.DATA_FOLDER)
app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, config.UPLOAD_FOLDER)
app.config["TEMP_FOLDER"] = os.path.join(app.root_path, config.TEMP_FOLDER)
app.config["TEMPLATE_FOLDER"] = os.path.join(app.root_path, config.TEMPLATE_FOLDER)


@app.before_request
def is_authenticated():
    if request.path.startswith(config.API_APPLICATION_ROOT):
        if request.headers.get("Authorization") is None:
            abort(401)
        else:
            token = request.headers.get("Authorization")
            if not KeycloakService.validate_token(token):
                abort(401)


# register api routes
for blueprint in vars(api_routes).values():
    if isinstance(blueprint, Blueprint):
        app.register_blueprint(blueprint, url_prefix=config.API_APPLICATION_ROOT)

# register wapp route
for blueprint in vars(wapp_page).values():
    if isinstance(blueprint, Blueprint):
        app.register_blueprint(blueprint, url_prefix=config.WAPP_APPLICATION_ROOT)

if __name__ == "__main__":
    if not app.debug or app.debug and werkzeug.serving.is_running_from_reloader():
        #Init the vault service -> Start token refresh routine
        VaultService()
    print("App running on: " + config.HOST + ":" + str(config.PORT))
    app.run(host=config.HOST, port=config.PORT)

