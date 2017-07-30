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
    apt-get -y -qq install htop bmon && \
    apt-get -y -qq install vim git && \
    apt-get -y -qq install inetutils-ping && \
    apt-get -y -qq install curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /src
RUN cd /src; git clone https://github.com/invisible-college/democracy.git
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
RUN . ~/.nvm/nvm.sh && nvm install v8.2.1
RUN cd /src/democracy; . ~/.nvm/nvm.sh && npm install

ENTRYPOINT ssh-keygen -t rsa -f ~/.ssh/id_rsa -N "" && /bin/bash

EXPOSE 8545
EXPOSE 30303
