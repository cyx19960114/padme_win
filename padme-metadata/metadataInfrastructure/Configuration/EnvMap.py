"""
Contains simple getter for ENV variables.
"""
from os import getenv

PREFIX = "MTP"
PREFIX_CONSTRUCTOR = lambda x: PREFIX + "_" + x


def configuration_folder():
    return getenv(PREFIX_CONSTRUCTOR("CONFIGURATION_FOLDER"), "./padme_metadata_config")

def station_iri():
    return getenv(PREFIX_CONSTRUCTOR("STATION_IRI"), None)

def port():
    return getenv(PREFIX_CONSTRUCTOR("PORT"), "8080")

def update_interval():
    return getenv(PREFIX_CONSTRUCTOR("UPDATE_INTERVAL"), 1)

def uplink_address():
    return getenv(PREFIX_CONSTRUCTOR("UPLINK"))