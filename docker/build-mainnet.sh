#! /bin/sh
# Build the geth mainnet image, which automatically starts up a geth node and syncs.

DOCKERDIR=geth-mainnet
cp geth-init.sh ${DOCKERDIR}/
cp geth.sh ${DOCKERDIR}/ 

. build.sh

rm ${DOCKERDIR}/geth-init.sh
rm ${DOCKERDIR}/geth.sh
