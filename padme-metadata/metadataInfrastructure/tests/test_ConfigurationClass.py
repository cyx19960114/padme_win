from unittest import TestCase
from tempfile import TemporaryDirectory
from pickle import dump

from metadataInfrastructure.Configuration import GatewayConfiguration, StationIriConfiguration, MetadataProviderConfiguration

class test_ConfigurationLoadingSaving(TestCase):
    def setUp(self) -> None:
        self.test_gateway_config = GatewayConfiguration(False, "http://example.org", False)
        self.test_station_iri_config = StationIriConfiguration(False, "http://station.example.org")
        self.temp_dir = TemporaryDirectory()
        
        self.test_metadata_provider_config = MetadataProviderConfiguration(self.temp_dir.name)

    def test_loading_pickled_gateway_config(self):
        # manually store the gateway config
        with open(self.test_metadata_provider_config._gateway_path, "wb") as f:
            dump(self.test_gateway_config, f)
        self.assertTrue(self.test_metadata_provider_config.gateway_config_exists())
        self.test_metadata_provider_config.load_gateway_config()
        self.assertEqual(self.test_gateway_config.secret_key, self.test_metadata_provider_config.gateway.secret_key)
        self.assertEqual(self.test_gateway_config.enable_healthcheck, self.test_metadata_provider_config.gateway.enable_healthcheck)
        self.assertEqual(self.test_gateway_config.uplink_adress, self.test_metadata_provider_config.gateway.uplink_adress)

    def test_loading_pickled_station_iri_config(self):
        # manually store the gateway config
        with open(self.test_metadata_provider_config._station_iri_path, "wb") as f:
            dump(self.test_station_iri_config, f)
        self.assertTrue(self.test_metadata_provider_config.station_iri_config_exists())
        self.test_metadata_provider_config.load_station_iri_config()
        self.assertEqual(self.test_station_iri_config.iri, self.test_metadata_provider_config.station_iri.iri)
        self.assertEqual(self.test_station_iri_config.set_via_env, self.test_metadata_provider_config.station_iri.set_via_env)