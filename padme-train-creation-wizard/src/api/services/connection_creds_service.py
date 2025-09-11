from flask import current_app
import os
import json

from api.util import constants

JsonKeys = constants.ConnectionCredsResponseJsonKeys


class ConnectionCredentialsService:
    def __init__(self, train_id):
        self.train_id = train_id

    def get_credentials_file_location(self):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], self.train_id, constants.TRAIN_CONNECTION_CREDENTIALS
        )

        return file_location

    def get_connection_credentials(self):
        file_location = self.get_credentials_file_location()
        with open(file_location) as infile:
            connection_credentials = json.load(infile)

        return connection_credentials

    def save_connection_credentials(self, connection_params):
        file_location = self.get_credentials_file_location()

        with open(file_location, "w") as outfile:
            json.dump(connection_params, outfile)

        with open(file_location, "r") as infile:
            connection_credentials = json.load(infile)

        return connection_credentials

