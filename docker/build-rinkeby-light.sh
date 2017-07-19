#! /bin/sh
# Build and tag all docker images

# To upload, do
# docker login
# docker push <image_name>:<tag>

# This is the base image for the others
DOCKERDIR=geth-rinkeby-light
IMAGE=cryptogoth/$DOCKERDIR:latest
cp rinkeby-init.sh $DOCKERDIR/
cp rinkeby.sh $DOCKERDIR/ 
cp rinkeby.json $DOCKERDIR/ 
docker build $DOCKERDIR -t $IMAGE

