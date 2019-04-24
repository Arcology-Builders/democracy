# Based on https://github.com/Kunstmaan/docker-ethereum/blob/master/geth/Dockerfile
FROM ubuntu:bionic
MAINTAINER Paul Pham

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && \
    apt-get -y -qq upgrade && \
    apt-get -y -qq install apt-utils && \
    apt-get -y -qq install software-properties-common && \
    add-apt-repository ppa:ethereum/ethereum && \
    apt-get update && \
    apt-get -y -qq install geth solc && \
    apt-get -y -qq install net-tools telnet htop bmon vim git inetutils-ping curl tmux && \
    apt-get -y -qq install make gcc g++ autoconf automake python neovim ssh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /src
RUN cd /src; git clone https://github.com/invisible-college/democracy.git
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
RUN . ~/.nvm/nvm.sh && nvm install v11.14.0 && npm i -g lerna
RUN . ~/.nvm/nvm.sh && npm i -g yarn
RUN cd /src/democracy; . ~/.nvm/nvm.sh && lerna bootstrap

ENTRYPOINT ssh-keygen -t rsa -f ~/.ssh/id_rsa -N "" && /bin/bash

EXPOSE 8545
EXPOSE 30303
