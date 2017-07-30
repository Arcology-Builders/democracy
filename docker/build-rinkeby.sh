#! /bin/sh
# Build and tag all docker images

# To upload, do
# docker login
# docker push <image_name>:<tag>

# This is the base image for the others
GIT_HASH=$(git log | head -n 1 | cut -f 2 -d ' ' | head -c 7)
DOCKERDIR=geth-rinkeby
IMAGE=cryptogoth/$DOCKERDIR:${GIT_HASH}
cp rinkeby-init.sh $DOCKERDIR/
cp rinkeby.sh $DOCKERDIR/ 
cp rinkeby.json $DOCKERDIR/ 
docker build $DOCKERDIR -t $IMAGE
rm ${DOCKERDIR}/rinkeby-init.sh
rm ${DOCKERDIR}/rinkeby.sh
rm ${DOCKERDIR}/rinkeby.json
