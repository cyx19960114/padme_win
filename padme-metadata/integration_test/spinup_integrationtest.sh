METADATA_PROVIDER_IMAGE=metadata_integration_test
METADATA_STORE_IMAGE=metadata_store_integration_test
INTEGRATION_TEST_IMAGE=integration_tester
POSTGRES_IMAGE=postgres:latest
MOCK_PORT=6789
NETWORK=integration_test_netw

echo "spinup images"
echo "creating network"
docker network create $NETWORK
sleep 5

docker run --rm -d --network integration_test_netw --name postgres_integration_test_graph_store -e POSTGRES_PASSWORD=12345 $POSTGRES_IMAGE
docker run --rm -d --network integration_test_netw --name postgres_integration_test_misc -e POSTGRES_PASSWORD=12345 $POSTGRES_IMAGE
echo "Wait for database creation..."
sleep 3
echo "Starting metadataprovider..."
docker run --rm -d --network integration_test_netw --name provider_integration_test -e MTP_UPLINK=http://store_integration_test:$MOCK_PORT/feed $METADATA_PROVIDER_IMAGE
docker run --rm -d --network integration_test_netw --name store_integration_test -e MSTORE_GRAPHSQL=postgresql://postgres:12345@postgres_integration_test_graph_store -e MSTORE_DATABASE=postgresql://postgres:12345@postgres_integration_test_misc -e MSTORE_REGISTRYKEYS=12345 -e MSTORE_PORT=$MOCK_PORT -e MSTORE_STATIONREGISTRYPREFIX=http://station.example.org/ $METADATA_STORE_IMAGE
docker logs -f provider_integration_test 2>&1 | sed 's/^/Provider: /' &
docker logs -f store_integration_test 2>&1 | sed 's/^/Store: /' &
echo "wait 10s"
sleep 3
echo "Assume everything is set up. Run Tests now..."
docker run -i --rm --network integration_test_netw --name integration_test_runner -e PROVIDER_URL=provider_integration_test -e PROVIDER_PORT=9988 -e STORE_URL=store_integration_test -e STORE_PORT=$MOCK_PORT $INTEGRATION_TEST_IMAGE | sed -e "s/^/Integ tester: /"
INTEGRATION_TEST_RESULT=$?

echo "Spin down..."

docker stop provider_integration_test
docker stop store_integration_test
docker stop postgres_integration_test_graph_store
docker stop postgres_integration_test_misc

docker network rm $NETWORK
if [ $INTEGRATION_TEST_RESULT == 0 ];
then
    echo "Integration Test passed!"
    exit 0
else
    echo "Integration Test failed!"
    exit 1
fi