import logging
import os

DEBUG = os.getenv("ENVIRONMENT") == "DEV"
# For both endpoints: Ensure they end with '/'
WAPP_APPLICATION_ROOT = os.getenv("WAPP_APPLICATION_ROOT", "/").rstrip('/') + '/'
API_APPLICATION_ROOT = os.getenv("API_APPLICATION_ROOT", "/api/").rstrip('/') + '/'
HOST = os.getenv("APPLICATION_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5001"))

KC_REALM = os.getenv("KC_REALM")
KC_URL = os.getenv("KC_URL")
KC_CLIENT_ID = os.getenv("KC_CLIENT_ID")
GITLAB_URL = os.getenv("GITLAB_URL")

DATA_FOLDER = os.path.join('api', 'data')
UPLOAD_FOLDER = os.path.join(DATA_FOLDER, 'uploads')
TEMP_FOLDER = os.path.join(DATA_FOLDER, 'tmp')
FLASK_TEMPLATES_FOLDER = 'templates'

logging.basicConfig(
    level=logging.DEBUG,
    format="%(levelname)s: %(asctime)s \
        pid:%(process)s module:%(module)s %(message)s",
    datefmt="%d/%m/%y %H:%M:%S",
)
