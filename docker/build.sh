#! /bin/sh
# Build and tag all docker images

# To upload, do
# docker login
# docker push <image_name>:<tag>

# This is the base image for the others
docker build geth -t geth:latest
docker build geth-private -t geth-private:latest

