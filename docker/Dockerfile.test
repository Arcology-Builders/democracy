# Based on https://github.com/Kunstmaan/docker-ethereum/blob/master/geth/Dockerfile
FROM node:11.13.0-alpine
MAINTAINER Paul Pham

RUN apk update
RUN apk add sudo
RUN apk add make
RUN apk add gcc
RUN apk add g++
RUN apk add autoconf
RUN apk add automake
RUN apk add python2
RUN apk add git
RUN apk add neovim
RUN apk add openssh
RUN apk add net-tools
RUN apk add wget
RUN apk add tmux
RUN apk add curl
RUN apk add bash

# Need to create a shell profile file first, so nvm has something to load into
RUN touch ~/.profile
RUN echo "export PATH=$PATH:/bin/versions/node/v11.2.0/bin" >> ~/.profile
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
RUN npm config delete prefix 
RUN . ~/.nvm/nvm.sh && npm config set prefix $NVM_DIR/versions/node/v11.2.0

RUN . ~/.nvm/nvm.sh && nvm install v11.2.0
RUN . ~/.nvm/nvm.sh && nvm use v11.2.0
RUN  npm i -g truffle@4.1.14    
RUN  npm i -g lerna@3.13.0     
RUN  npm i -g pm2              
RUN  npm i -g ganache-cli@6.3.0
RUN  npm i -g eslint           
RUN  npm i -g mocha           
RUN  npm i -g nyc

RUN ln -s /usr/sbin/nvim /usr/local/bin/vi

ENTRYPOINT . ~/.nvm/nvm.sh \
  && /bin/versions/node/v11.2.0/bin/ganache-cli \
       --debug -v -p 8545 --hostname 0.0.0.0 

EXPOSE 8545
