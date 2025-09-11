import rdflib
import base64
import sys
import http.client
import urllib.request as request
import json

from metadataInfrastructure.GraphContainer import GraphContainer

ENROLLMENT_PATH="/stations/enroll"
SECRET_KEY_PATH="/stations/secretkey"
UPLOAD_PATH="/entities/stations/"


def upload_graph():
    url = sys.argv[2]
    print(url)
    g = rdflib.Graph()
    path_to_graph = sys.argv[3]
    with open(path_to_graph, "r") as f:
        g.parse(f)

    secret_key = input("secret signing key:")

    gc = GraphContainer(g)
    signature = gc.sign(secret_key.encode())
    b64_signature = base64.urlsafe_b64encode(signature).decode()
    print("data signed with signature:" + b64_signature)
    if input("Continue with uploading(Y/n):") == "n":
        return
    req = request.Request(url + f"?signature={b64_signature}", data=gc.serialized().encode(), method="PUT")
    req.add_header("Content-Type", "text/turtle")
    with request.urlopen(req) as url:
        if url.getcode() == 200:
            print("Successful uploaded the data.")
        else:
            print("Error while upladoing the data. Code:" + str(url.getcode()))

def setup_provider():
    if len(sys.argv) < 3:
        print("Usage: tool.py setup <provider url>")
        exit(1)
        
    provider_url = sys.argv[2]
    station_identifier = input("Station Identifier (full url):")
    secret_token = input("Secret Token (String will be encoded as bytes):")
    body = json.dumps({
        "stationIdentifier": station_identifier
    })
    req = request.Request(provider_url + "/configuration/general", data=body.encode(), method="POST")
    with request.urlopen(req) as url:
        if url.getcode() == 200:
            print("Successful configuration.")
        else:
            print("Error while configuration. Code:" + str(url.getcode()))

    req = request.Request(provider_url + "/configuration/secret", data=secret_token.encode(), method="POST")
    with request.urlopen(req) as url:
        if url.getcode() == 200:
            print("Successful setup of secret key.")
        else:
            print("Error while setup of secret key. Code:" + str(url.getcode()))

def get_configuration():
    url = sys.argv[2]
    req = request.Request(url + "/configuration/general")
    response = request.urlopen(req)
    if response.getcode() == 200:
        print(json.dumps(json.load(response)))
    else:
        print("Error")

def enroll():
    #url = input("Full IRI of the entity that should be enrolled:")
    #server = input("Server adress:")
    #key = input("Valid registry key for enrollment:")
    url = sys.argv[2]
    server = sys.argv[3]
    key = sys.argv[4]
    req = request.Request(server+ENROLLMENT_PATH, json.dumps({
        "iri": url,
        "registry_key": key
    }).encode(), method="POST")
    response = None
    try:
        response: http.client.HTTPResponse = request.urlopen(req)
        if response.status != 200:
            print("Error while requesting data: " + response.reason)
            return
    except Exception as e:
        print("Eror while sending request:" + str(e))
        return
    else:
        print("Done.")
        secret_token = json.load(response)["secret"]
    finally:
        if response is not None:
            response.close()
    
    print("Recevied secret token:" + secret_token)
    print("Setting new secret key...")
    secret_key = input("Secret key:").encode()

    req = request.Request(server+SECRET_KEY_PATH + f"?token={secret_token}", secret_key, method="POST")

    try:
        response: http.client.HTTPResponse = request.urlopen(req)
        if response.status != 200:
            print("Error while sending request:" + response.reason)
            return
    except Exception as e:
        print("Eror while sending request:" + str(e))
        return
    else:
        print("Done.")
    finally:
        if response is not None:
            response.close()


actions = {
    "upload": upload_graph,
    "enroll": enroll,
    "setup": setup_provider,
    "read_config": get_configuration
}


if len(sys.argv) > 1 and sys.argv[1] in actions:
    actions[sys.argv[1]]()
else:
    print("Command not found. Possible values: " + ", ".join(actions.keys()))
