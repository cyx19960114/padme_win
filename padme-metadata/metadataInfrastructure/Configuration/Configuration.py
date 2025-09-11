"""This file contains the code for the Configuration parser, which uses templates located in the modules,
to automatically create a dictionary containing all configurations out of env variables and a config file."""
import logging
from os import environ
from dataclasses import dataclass, field
from pickle import dump, load
from typing import Any, Optional, List
from pathlib import Path
logger = logging.getLogger(__name__)


class IncompleteConfigurationException(Exception):
    pass

# the template for general Configuration


class ConfigurationManager:
    def __init__(self) -> None:
        pass

@dataclass
class ApiSettableConfig(object):
    # indicates whethe configuration object was configured via environment variables
    # or via REST interface
    # if it was setted via env, it can not be altered by the REST interface
    set_via_env: bool

    # default factory produces function which does nothing to prevent errors
    _save_function: Any = field(init=False, default_factory=lambda: (lambda: None))

    def _save(self, path: str = None):
        with open(path, "wb") as f:
            dump(self, f)

    def save(self):
        """
        Save the configuration via the Parent Config Object
        """
        if self._save_function is not None:
            self._save_function()

    # overwrite methods to ingore _save_function field in (un-)pickling
    # see https://docs.python.org/3/library/pickle.html#handling-stateful-objects
    def __getstate__(self):
        state = self.__dict__.copy()
        del state["_save_function"]
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self._save_function = lambda: None

@dataclass
class EventFilterConfiguration(ApiSettableConfig):
    """
    Contains configuration for the event filter.
    Nothing can be set via env
    """
    list: List[str] = field(default_factory=list)
    use_as_allow_list: bool = False

@dataclass
class GatewayConfiguration(ApiSettableConfig):
    """
    Contains configuration for a gateway.
    The secret_key cannot be set via env.
    """
    uplink_adress: str
    enable_healthcheck: bool = False
    secret_key: Optional[bytes] = None
    
@dataclass
class StationIriConfiguration(ApiSettableConfig):
    """
    Contains configuration for the iri of the station to which the created metadata is associated
    """
    iri: Optional[str] = None

class MetadataProviderConfiguration:
    """
    Contains configuration for running instance.
    All attributes of this class are just loaded from env variables and not persistently changable via other means.
    For all attributes that should be changable via other means, e.g. api, subclasses are used, from which pickled objects are stored.
    """
    def __init__(self, configuration_folder: Optional[str] = None) -> None:
        self.listening_port: int = 8080
        self.station_iri: Optional[StationIriConfiguration] = None
        self.persistence_file_location: str = None
        self.gateway: Optional[GatewayConfiguration] = None
        self.event_filter: Optional[EventFilterConfiguration] = None

        self._configuration_folder = configuration_folder

        self._gateway_path = Path(configuration_folder + "/gateway.pickle")
        self._station_iri_path = Path(configuration_folder + "/station_iri.pickle")
        self._filter_path = Path(configuration_folder + "/filter.pickle")


    def create_configuration_folder(self):
        """
        Create the configuration folder if it not exists
        """
        cp = Path(self._configuration_folder)
        if cp.exists():
            if cp.is_dir():
                return
            else:
                raise ValueError("Configuration folder is a file!")
                # change to relevant error
        else:
            cp.mkdir()
    def load_gateway_config(self):
        """
        Load the gateway config from pickled object
        """
        with open(self._gateway_path, "rb") as f:
            self.gateway = load(f)

    def load_gateway_config_key(self, url: str):
        """
        Load the gateway config from pickled object and overwrite the url with value.
        Used if url is set via env, since key cannot be set via env.
        """
        with open(self._gateway_path, "rb") as f:
            self.gateway = load(f)
            self.gateway.uplink_adress = url

    def load_station_iri_config(self):
        """
        Load the station iri config from pickled object
        """
        with open(self._station_iri_path, "rb") as f:
            self.station_iri = load(f)

    def load_filter_config(self):
        """
        Load the event filter configuration from the pickled object
        """
        with open(self._filter_path, "rb") as f:
            self.event_filter = load(f)

    def gateway_config_exists(self):
        return self._gateway_path.is_file()

    def station_iri_config_exists(self):
        return self._station_iri_path.is_file()

    def filter_config_exists(self):
        return self._filter_path.is_file()

    def save_gateway_config(self):
        self.gateway._save(self._gateway_path)
    
    def save_station_iri_config(self):
        self.station_iri._save(self._station_iri_path)

    def save_eventfilter_config(self):
        self.event_filter._save(self._filter_path)

    def set_gateway_config(self, gateway_config: GatewayConfiguration):
        self.gateway = gateway_config
        self.gateway._save_function = lambda: self.save_gateway_config()

    def set_station_iri_config(self, station_iri_config: StationIriConfiguration):
        self.station_iri = station_iri_config
        self.station_iri._save_function = lambda: self.save_station_iri_config()

    def set_filter_config(self, filter_config: EventFilterConfiguration):
        self.event_filter = filter_config
        self.event_filter._save_function = lambda: self.save_eventfilter_config()