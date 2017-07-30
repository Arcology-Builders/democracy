#! /bin/sh
# Include this file at the end of your other build-*.sh scripts
# Define DOCKERDIR beforehand.

# Ex: in build-some-image.sh
# DOCKERDIR=some-image
# . build.sh $1

# When you call the outer script, you can pass in an argument "push"
# to push the image as well.

# ./build-some-image.sh

# Currently only cryptogoth can push these images
# with his dockerhub login.

# docker login
# docker push <image_name>:<tag>

# This is the base image for the others
GIT_HASH=$(git log | head -n 1 | cut -f 2 -d ' ' | head -c 7)
REPO="cryptogoth"
IMAGE=${REPO}/${DOCKERDIR}:${GIT_HASH}
docker build ${DOCKERDIR} -t $IMAGE
docker tag ${IMAGE} ${REPO}/${DOCKERDIR}:latest

if [ ! -z "$1" ]; then
  docker push ${IMAGE}
fi
