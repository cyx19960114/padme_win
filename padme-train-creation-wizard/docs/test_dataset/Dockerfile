FROM python:3.11

MAINTAINER "S Balyan <shubham.balyan@rwth-aachen.de>"

#RUN apt-get update -qq && apt-get install -qqy \
 #   apt-transport-https \
  #  ca-certificates \
   # curl \
    #lxc \
    #iptables
    
# Install Docker from Docker Inc. repositories.
#RUN curl -sSL https://get.docker.com/ | sh

RUN apt-get update -qq && apt-get install -qqy openssh-client openssh-server net-tools
#RUN ufw allow 22

COPY ./requirements.txt ./
RUN pip install -r requirements.txt

RUN mkdir -p /analysis-code
WORKDIR /analysis-code/
COPY ./mnist_pca.py /analysis-code

EXPOSE 5064

#RUN apt-get install -y --reinstall systemd

CMD [ "python", "/bin/bash", "-c" ]