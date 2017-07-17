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
    apt-get -y -qq install net-tools && \
    apt-get -y -qq install telnet && \
    apt-get -y -qq install inetutils-ping && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 8545
EXPOSE 30303
