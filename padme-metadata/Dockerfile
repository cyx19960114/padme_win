FROM python:3.8
LABEL description="Contains the station software for the PHT metadata infrastructure"
COPY . metadata
WORKDIR metadata
COPY .git .git
RUN git submodule update
RUN pip3 install .
RUN chmod +x bin/metadataprovider
CMD bin/metadataprovider