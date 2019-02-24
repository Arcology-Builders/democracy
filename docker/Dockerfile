# Based on https://github.com/Kunstmaan/docker-ethereum/blob/master/geth/Dockerfile
FROM base/archlinux:2019.01.01
MAINTAINER Paul Pham
ENV nv=v11.2.0

RUN pacman -Sy && \
    echo "Y" | pacman -Sy sudo && \
    echo "Y" | pacman -Sy make && \
    echo "Y" | pacman -Sy gcc && \
    echo "Y" | pacman -Sy autoconf && \
    echo "Y" | pacman -Sy automake && \
    echo "Y" | pacman -Sy python2 && \
    echo "Y" | pacman -Sy git && \
    echo "Y" | pacman -Sy neovim && \
    echo "Y" | pacman -Sy openssh && \
    echo "Y" | pacman -Sy net-tools && \
    echo "Y" | pacman -Sy wget && \
    echo "Y" | pacman -Sy tmux

# Need to create a shell profile file first, so nvm has something to load into
RUN touch ~/.profile
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
RUN . ~/.nvm/nvm.sh && nvm install v11.2.0 && \
  npm i -g truffle@4.1.15 && \
  npm i -g lerna@3.13.0   && \
  npm i -g pm2            && \
  npm i -g mocha          && \
  npm i -g ganache-cli

RUN mkdir /src
RUN cd /src; git clone https://github.com/invisible-college/democracy
RUN cd /src/democracy; . ~/.nvm/nvm.sh && npm install

RUN ln -s /usr/sbin/nvim /usr/local/bin/vi

ENTRYPOINT . ~/.nvm/nvm.sh \
  && node /root/.nvm/versions/node/v11.2.0/bin/ganache-cli \
       --debug -v --hostname 0.0.0.0 

EXPOSE 8545
