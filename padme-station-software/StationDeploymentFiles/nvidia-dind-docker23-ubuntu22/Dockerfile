# CUDA Version and OS version should match the underlying Host
ARG CUDA_IMAGE=nvidia/cuda:11.7.1-runtime-ubuntu22.04
FROM ${CUDA_IMAGE}

# https://github.com/docker/docker/blob/master/project/PACKAGERS.md#runtime-dependencies
RUN set -eux; \
    apt-get update -q && \
	apt-get install -yq \
		btrfs-progs \
		e2fsprogs \
		# e2fsprogs-extra \
		# ip6tables \
		iptables \
		openssl \
		# shadow-uidmap \
		xfsprogs \
		xz-utils \
# pigz: https://github.com/moby/moby/pull/35697 (faster gzip implementation)
		pigz \
        # zfs \
		wget \
        curl \
		dnsmasq
	# ; \
# only install zfs if it's available for the current architecture
# https://git.alpinelinux.org/cgit/aports/tree/main/zfs/APKBUILD?h=3.6-stable#n9 ("all !armhf !ppc64le" as of 2017-11-01)
# "apk info XYZ" exits with a zero exit code but no output when the package exists but not for this arch
	# if zfs="$(apk info --no-cache --quiet zfs)" && [ -n "$zfs" ]; then \
	# 	apk add --no-cache zfs; \
	# fi

# TODO aufs-tools

# set up subuid/subgid so that "--userns-remap=default" works out-of-the-box
RUN set -eux; \
	addgroup --system dockremap; \
	adduser --system -ingroup dockremap dockremap; \
	echo 'dockremap:165536:65536' >> /etc/subuid; \
	echo 'dockremap:165536:65536' >> /etc/subgid

RUN set -eux; \
	# apkArch="$(apk --print-arch)"; \
	# case "$apkArch" in \
	# 	'x86_64') \
	# 		url='https://download.docker.com/linux/static/stable/x86_64/docker-20.10.18.tgz'; \
	# 		;; \
	# 	'armhf') \
	# 		url='https://download.docker.com/linux/static/stable/armel/docker-20.10.18.tgz'; \
	# 		;; \
	# 	'armv7') \
	# 		url='https://download.docker.com/linux/static/stable/armhf/docker-20.10.18.tgz'; \
	# 		;; \
	# 	'aarch64') \
	# 		url='https://download.docker.com/linux/static/stable/aarch64/docker-20.10.18.tgz'; \
	# 		;; \
	# 	*) echo >&2 "error: unsupported 'docker.tgz' architecture ($apkArch)"; exit 1 ;; \
	# esac; \
	# \
	# Get the correct docker version for your architecture
	wget -O 'docker.tgz' 'https://download.docker.com/linux/static/stable/x86_64/docker-23.0.1.tgz'; \
	\
	tar --extract \
		--file docker.tgz \
		--strip-components 1 \
		--directory /usr/local/bin/ \
		--no-same-owner \
# we exclude the CLI binary because we already extracted that over in the "docker:20.10-cli" image that we're FROM and we don't want to duplicate those bytes again in this layer
		# --exclude 'docker/docker' \ We need the docker binary, above line is not relevant  
	; \
	rm docker.tgz; \
	\
	dockerd --version; \
	containerd --version; \
	ctr --version; \
	runc --version

# https://github.com/docker/docker/tree/master/hack/dind
ENV DIND_COMMIT 1f32e3c95d72a29b3eaacba156ed675dba976cb5

RUN set -eux; \
	wget -O /usr/local/bin/dind "https://raw.githubusercontent.com/docker/docker/${DIND_COMMIT}/hack/dind"; \
	chmod +x /usr/local/bin/dind

# Install Nvidia Container Toolkit and Nvidia-Docker2

RUN distribution=$(. /etc/os-release;echo $ID$VERSION_ID) \
      && curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
      && curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
            sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
            tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

RUN apt-get update -q && \
	apt-get install -yq \
	nvidia-docker2

# Copy the docker deamon configuration with the nvidia runtime config, correct ip ranges and default bridge ip
COPY deamon.json /etc/docker/daemon.json

# Configure DNSMASQ to listen at 172.31.0.1 (default bridge network)
RUN echo "listen-address=172.31.0.1" > /etc/dnsmasq.conf

COPY dockerd-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/dockerd-entrypoint.sh

VOLUME /var/lib/docker
EXPOSE 2375 2376

ENTRYPOINT ["dockerd-entrypoint.sh"]
CMD []