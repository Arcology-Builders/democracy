#! /bin/sh
# Build and tag all docker images

# To upload, do
# docker login
# docker push <image_name>:<tag>

# This is the base image for the others
DOCKERDIR=geth-light
IMAGE=cryptogoth/$DOCKERDIR:latest
cp geth-init.sh $DOCKERDIR/
cp geth.sh $DOCKERDIR/ 
docker build $DOCKERDIR -t $IMAGE

