#! /bin/sh
# Include this file at the end of your other build-*.sh scripts
# Define DOCKERDIR beforehand.

# To upload, do
# docker login
# docker push <image_name>:<tag>

# This is the base image for the others
GIT_HASH=$(git log | head -n 1 | cut -f 2 -d ' ' | head -c 7)
REPO="invisible-college"
IMAGE=${REPO}/${DOCKERDIR}:${GIT_HASH}
docker build ${DOCKERDIR} -t $IMAGE
docker tag ${IMAGE} ${REPO}/${DOCKERDIR}:latest
