#!/bin/bash
docker rm -f postgres-${USER}
docker rm -f minio-${USER}
docker volume rm minio_${USER}_data
docker volume rm postgres_${USER}_data
