from flask import current_app
from werkzeug.exceptions import NotFound, BadRequest, UnsupportedMediaType
from werkzeug.utils import secure_filename
import os
import uuid
import shutil
import json
import zipfile
from os import listdir
from os.path import isfile, join

from api.util import constants
from api.models import UploadFiles


class UploadFilesService:
    @staticmethod
    def _gen_path_without_filename(train_id):
        base_path = os.path.join(current_app.config["UPLOAD_FOLDER"], train_id)
        return base_path

    @staticmethod
    def _gen_path_without_extension(train_id, file_name):
        base_file_path = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            train_id,
            file_name + "."
        )
        return base_file_path

    @staticmethod
    def allowed_data_files(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in constants.ALLOWED_EXTENSIONS

    @staticmethod
    def is_train_id_feasible(train_id):
        path = os.path.join(current_app.config['UPLOAD_FOLDER'], train_id)
        return os.path.exists(path)

    @staticmethod
    def save_data_analysis_file(file):
        if file.filename == '':
            raise NotFound(constants.ERROR_FILE_NOT_FOUND_IN_REQUEST_DATA)
        if file and UploadFilesService.allowed_data_files(file.filename):
            file_extension = secure_filename(file.filename).split('.')[1]
            file_name = secure_filename(file.filename).split('.')[0]
            train_id = str(uuid.uuid1())

            # Validate the contents of the log file before saving
            tmp_file_path = os.path.join(
                current_app.config['TEMP_FOLDER'],
                train_id + "." + file_extension
            )
            # temporarily store the file for processing
            file.save(tmp_file_path)

            # Check if the file contents are empty
            if os.stat(tmp_file_path).st_size == 0:
                raise BadRequest(constants.ERROR_EMPTY_FILE)

            os.makedirs(
                os.path.join(current_app.config['UPLOAD_FOLDER'], train_id)
            )
            base_path = UploadFilesService._gen_path_without_filename(train_id)
            os.chmod(base_path, 0o755)

            new_file_path = UploadFilesService._gen_path_without_extension(train_id, file_name)
            new_file_path += file_extension
            os.rename(tmp_file_path, new_file_path)

            return UploadFiles(train_id, file_extension)
        else:
            raise UnsupportedMediaType(constants.ERROR_INVALID_FILE)

    @staticmethod
    def allowed_req_files(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in constants.ALLOWED_EXTENSIONS_REQ

    @staticmethod
    def save_req_file(file, train_id):
        if file.filename == '':
            raise NotFound(constants.ERROR_FILE_NOT_FOUND_IN_REQUEST_REQ)
        if file and UploadFilesService.allowed_req_files(file.filename):
            file_extension = secure_filename(file.filename).split('.')[1]
            file_name = secure_filename(file.filename).split('.')[0]

            folder_location = os.path.join(
                current_app.config["UPLOAD_FOLDER"], train_id, file_name + "." + file_extension
            )

            # Store the requirements file
            file.save(folder_location)

            return file_extension, file_name
        else:
            raise UnsupportedMediaType(constants.ERROR_INVALID_FILE)

    @staticmethod
    def save_docker_file(file, train_id):
        if file.filename == '':
            raise NotFound(constants.ERROR_FILE_NOT_FOUND_IN_REQUEST_DOCKERFILE)
        if file and file.filename in constants.ALLOWED_DOCKER_FILE_NAME:
            folder_location = os.path.join(
                current_app.config["UPLOAD_FOLDER"], train_id, file.filename
            )

            if os.path.exists(folder_location):
                os.remove(folder_location)

            # Store the Dockerfile
            file.save(folder_location)

            return file.filename
        else:
            raise UnsupportedMediaType(constants.ERROR_INVALID_FILE)

    @staticmethod
    def cancel_train_image_creation(train_id):
        folder_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id
        )

        try:
            shutil.rmtree(folder_location)
        except OSError as e:
            raise NotFound(constants.ERROR_TRAIN_ID_DOESNT_EXIST)

    @staticmethod
    def create_connection_credentials_file(train_id):
        train_connection_credentials = []

        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.TRAIN_CONNECTION_CREDENTIALS
        )

        with open(file_location, "w") as outfile:
            json.dump(train_connection_credentials, outfile)

    @staticmethod
    def get_train_store_git_url(train_type):
        if train_type == constants.FEDERATED_LEARNING or train_type == constants.FEDERATED_AGGREGATION:
            return constants.OFFICIAL_FEDERATED_TRAIN_STORE_GIT_URL
        else:
            return constants.OFFICIAL_TRAIN_STORE_GIT_URL

    @staticmethod
    def create_metadata_file(train_id, train_type):
        project_url = UploadFilesService.get_train_store_git_url(train_type)
        train_initial_metadata = {
            "project_name": "PHTProjectName",
            "project_type": "Public",
            "project_url": project_url,
            "project_description": "Project Description",
            "additional_info": {}
        }

        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.TRAIN_METADATA
        )

        with open(file_location, "w") as outfile:
            json.dump(train_initial_metadata, outfile)

    @staticmethod
    def create_git_commit_info_file(train_id):
        git_commit_info = {
            "git_url": "",
            "project_id": "",
            "access_token": "",
            "branch": "",
            "commit_message": "",
            "new_branch": False,
            "new_branch_name": ""
        }

        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.PRIVATE_GIT_INFO
        )

        with open(file_location, "w") as outfile:
            json.dump(git_commit_info, outfile)

    @staticmethod
    def get_connection_params_file_location(train_id):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.TRAIN_CONNECTION_CREDENTIALS
        )
        return file_location

    @staticmethod
    def get_docker_file_content(train_id, py_main_args, custom_file_flag):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.DOCKER_FILE
        )
        if os.path.isfile(file_location) and custom_file_flag:
            with open(file_location, "r") as file:
                dockerfile_content = file.read()
        else:
            dockerfile_content = UploadFilesService.create_docker_file_from_template(train_id, py_main_args)
        return dockerfile_content

    @staticmethod
    def create_docker_file_from_template(train_id, py_main_args):
        base_path = UploadFilesService._gen_path_without_filename(train_id)
        data_files = [f for f in listdir(base_path) if isfile(join(base_path, f))]
        req_txt_data_file = []
        for s_file in data_files:
            if s_file.endswith(constants.TXT_EXTENSION) or s_file.endswith(constants.R_EXTENSION) or s_file.endswith(
                    constants.R_SMALL_EXTENSION):
                req_txt_data_file.append(s_file)

        if req_txt_data_file[0].endswith(constants.TXT_EXTENSION):
            if py_main_args is None:
                main_data_file = [s for s in data_files if s.endswith(constants.PYTHON_EXTENSION)]
                main_file_docker = main_data_file[0]
            else:
                main_file_docker = py_main_args
        else:
            if py_main_args is None:
                main_data_file = []
                for s_file in data_files:
                    if s_file.endswith(constants.R_EXTENSION) or s_file.endswith(constants.R_SMALL_EXTENSION):
                        main_data_file.append(s_file)
                main_file_docker = main_data_file[0]
            else:
                main_file_docker = py_main_args

        connection_params_file_location = UploadFilesService.get_connection_params_file_location(train_id)
        with open(connection_params_file_location) as infile:
            connection_credentials = json.load(infile)

        if req_txt_data_file[0].endswith(constants.TXT_EXTENSION):
            template_folder_location = os.path.join(
                current_app.config["TEMPLATE_FOLDER"], constants.DOCKERFILE_TEMPLATE_NAME_PYTHON
            )
        else:
            template_folder_location = os.path.join(
                current_app.config["TEMPLATE_FOLDER"], constants.DOCKERFILE_TEMPLATE_NAME_R
            )

        with open(template_folder_location, "r") as file:
            dockerfile_template_content = file.read()

        # Environment variables manipulations
        connection_credentials_json = json.dumps(connection_credentials)
        connection_credentials_json = connection_credentials_json.replace('"', '\\"')

        if connection_credentials[0]['name']:
            env_variables_label = constants.ENV_VAR_LABEL_DOCKERFILE.format(env_variables_info=connection_credentials_json)
        else:
            env_variables_label = ""

        # Format the dockerfile from template
        dockerfile_from_template = dockerfile_template_content.format(
            env_var_labels=env_variables_label, req_file_name=req_txt_data_file[0],
            main_file_name=main_file_docker)

        return dockerfile_from_template

    @staticmethod
    def save_docker_file_from_template(train_id, std_dockerfile):
        file_location = os.path.join(
            current_app.config["UPLOAD_FOLDER"], train_id, constants.DOCKER_FILE
        )

        if os.path.exists(file_location):
            os.remove(file_location)

        content = std_dockerfile['docker_file_content']

        with open(file_location, "w+") as outfile:
            outfile.write(content)

    @staticmethod
    def get_file_names_entry_point(train_id):
        global zip_task_file
        zip_flag = False
        base_location = UploadFilesService._gen_path_without_filename(train_id)
        all_data_files = [f for f in listdir(base_location) if isfile(join(base_location, f))]
        for file in all_data_files:
            if file.endswith(constants.ZIP_EXTENSION) or file.endswith(constants.SEVEN_ZIP_EXTENSION):
                zip_task_file = file
                zip_flag = True
                break

        if zip_flag:
            zip_task_file_location = os.path.join(base_location, zip_task_file)
            zip_object = zipfile.ZipFile(zip_task_file_location)
            relevant_files = [s for s in zip_object.namelist() if not s.endswith("/")]
            # Unzip the files for Git commit
            with zipfile.ZipFile(zip_task_file_location, 'r') as zip_ref:
                zip_ref.extractall(base_location)
        else:
            relevant_files = []
            for file in all_data_files:
                if file.endswith(constants.PYTHON_EXTENSION) or file.endswith(constants.R_EXTENSION) or file.endswith(
                        constants.R_SMALL_EXTENSION):
                    relevant_files.append(file)

        return relevant_files
