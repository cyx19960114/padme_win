FROM python:3.8
LABEL description="Contains the station software for the PHT metadata infrastructure"
COPY . metadata
WORKDIR metadata
# Skip git submodule update for local deployment
RUN pip3 install .
RUN chmod +x bin/metadataprovider
CMD bin/metadataprovider