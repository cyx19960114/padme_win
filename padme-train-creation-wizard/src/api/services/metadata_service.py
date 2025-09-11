from flask import current_app
import os
import json

from api.util import constants


class MetadataService:
    def __init__(self, train_id):
        self.train_id = train_id

    def get_metadata_file_location(self):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], self.train_id, constants.TRAIN_METADATA
        )

        return file_location

    def get_metadata(self):
        file_location = self.get_metadata_file_location()
        with open(file_location) as infile:
            metadata = json.load(infile)

        return metadata

    def save_metadata(self, metadata_json):
        file_location = self.get_metadata_file_location()

        with open(file_location, "w") as outfile:
            json.dump(metadata_json, outfile)

        metadata_json[constants.TRAIN_ID] = self.train_id
        return metadata_json

