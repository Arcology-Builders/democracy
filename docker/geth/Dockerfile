# Based on https://github.com/Kunstmaan/docker-ethereum/blob/master/geth/Dockerfile
FROM ubuntu:zesty
MAINTAINER Paul Pham

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && \
    apt-get -y -qq upgrade && \
    apt-get -y -qq install software-properties-common && \
    add-apt-repository ppa:ethereum/ethereum && \
    apt-get update && \
    apt-get -y -qq install geth solc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 8545
EXPOSE 30303
