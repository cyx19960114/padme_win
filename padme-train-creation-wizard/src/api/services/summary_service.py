from flask import current_app
import os
import json
from os import listdir
from os.path import isfile, join

from api.util import constants

JsonKeys = constants.ConnectionCredsResponseJsonKeys


class SummaryService:
    def __init__(self, train_id):
        self.train_id = train_id

    def get_base_location(self):
        base_location = os.path.join(current_app.config["UPLOAD_FOLDER"], self.train_id)
        return base_location

    def get_credentials_file_location(self):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], self.train_id, constants.TRAIN_CONNECTION_CREDENTIALS
        )
        return file_location

    def get_metadata_file_location(self):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], self.train_id, constants.TRAIN_METADATA
        )
        return file_location

    def get_trimmed_dir_file_name(self, pht_file):
        split_strings = pht_file.split(self.train_id, 1)
        return split_strings[1].replace("\\", "/")

    def get_summary(self):
        connection_params_file_location = self.get_credentials_file_location()
        metadata_file_location = self.get_metadata_file_location()
        base_location = self.get_base_location()

        all_data_files = []
        for root, dirs, files in os.walk(base_location):
            for name in files:
                filePath = os.path.abspath(os.path.join(root, name))
                all_data_files.append(filePath)
        json_data_files = [s for s in all_data_files if s.endswith(constants.JSON_FILE_EXTENSION)]
        uploaded_data_files = list(set(all_data_files) - set(json_data_files))
        summary_data_files = []
        for file in uploaded_data_files:
            summary_data_files.append(self.get_trimmed_dir_file_name(file))

        with open(connection_params_file_location) as infile:
            connection_credentials = json.load(infile)

        with open(metadata_file_location) as infile:
            metadata = json.load(infile)

        summary = {
            "connection_params": connection_credentials,
            "metadata": metadata,
            "data_files": summary_data_files
        }

        return summary
