import os
from flask import Blueprint, render_template, send_from_directory
from werkzeug.exceptions import HTTPException, BadRequest, InternalServerError
import config

wapp_page = Blueprint("wapp", __name__)


@wapp_page.route("/", methods=["GET"])
def send_index_page():
    return send_from_directory("wapp", "index.html")


@wapp_page.route("/views/<path:path>", methods=["GET"])
def send_views(path):
    return send_from_directory("wapp/views", path)


@wapp_page.route("/js/<path:path>", methods=["GET"])
def send_js(path):
    # Render the template if exists, otherwise return static file
    folder = "wapp/js"
    templateName = f"{path}.jinja"
    if os.path.exists(os.path.join(config.FLASK_TEMPLATES_FOLDER, folder, templateName)):
        template = render_template(os.path.join(folder, templateName), config=config)
        #Change mime type to JS
        return template, 200, {'Content-Type': "text/javascript"}
    else:
        return send_from_directory(folder, path, mimetype="text/javascript")

@wapp_page.route("/css/<path:path>", methods=["GET"])
def send_css(path):
    return send_from_directory("wapp/css", path)


@wapp_page.route("/images/<path:path>", methods=["GET"])
def send_images(path):
    return send_from_directory("wapp/images", path)
