FROM ubuntu:latest

# Install needed packages (SSH agent and gettext-base for envsubst command)
RUN apt-get update \
    && apt-get install -y openssh-client gettext-base wget

# Install yq (helper tool for processing yaml files)
ARG YQ_VERSION=v4.34.2
RUN wget https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_amd64 -O /usr/bin/yq && chmod +x /usr/bin/yq

# Create dir for SSH 
RUN  mkdir -p /root/.ssh

# Copy the helper scripts and add them to the PATH
COPY scripts /root/bin/scripts
RUN chmod -R +x /root/bin/scripts
ENV PATH="/root/bin/scripts:${PATH}"

# Add the known hosts file from the build argument. Check that the build argument is defined
ARG KNOWN_HOST_KEYS
RUN [ -z "$KNOWN_HOST_KEYS" ] && echo "KNOWN_HOST_KEYS variable is required" && exit 1 || echo "$KNOWN_HOST_KEYS" > /root/.ssh/known_hosts

#COYP and set the entrypoint
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh
ENTRYPOINT [ "/bin/bash", "entrypoint.sh"]