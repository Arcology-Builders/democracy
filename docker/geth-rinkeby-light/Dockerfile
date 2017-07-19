FROM cryptogoth/geth
MAINTAINER Paul Pham

ADD ./rinkeby.sh /root/rinkeby.sh
ADD ./rinkeby-init.sh /root/rinkeby-init.sh
ADD ./rinkeby.json /root/rinkeby.json
RUN chmod +x /root/rinkeby.sh
RUN chmod +x /root/rinkeby-init.sh
RUN /root/rinkeby-init.sh light

# ENTRYPOINT /root/rinkeby.sh light
