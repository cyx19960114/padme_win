# DinD Dockerfile for PADME Playground
FROM docker:24-dind

# Disable TLS for local development
ENV DOCKER_TLS_CERTDIR=""

# Expose Docker daemon port without TLS
EXPOSE 2375

# Use default DinD entrypoint without TLS
CMD ["dockerd", "--host=0.0.0.0:2375", "--host=unix:///var/run/docker.sock", "--tls=false"]
