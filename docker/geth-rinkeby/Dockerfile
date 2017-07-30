FROM invisible-college/geth-base
MAINTAINER Paul Pham

ADD ./rinkeby.json /root/rinkeby.json
ADD ./rinkeby.sh /root/rinkeby.sh
ADD ./rinkeby-init.sh /root/rinkeby-init.sh
RUN chmod +x /root/rinkeby.sh
RUN chmod +x /root/rinkeby-init.sh
RUN /root/rinkeby-init.sh

CMD /root/rinkeby.sh
