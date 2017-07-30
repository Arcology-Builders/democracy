FROM cryptogoth/geth
MAINTAINER Paul Pham

ADD ./rinkeby.sh /root/rinkeby.sh
RUN chmod +x /root/rinkeby.sh
RUN /root/rinkeby-init.sh

CMD /root/rinkeby.sh
