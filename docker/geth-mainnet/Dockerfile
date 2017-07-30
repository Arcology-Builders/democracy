FROM invisible-college/geth-base
MAINTAINER Paul Pham

ADD ./geth.sh /root/geth.sh
ADD ./geth-init.sh /root/geth-init.sh
RUN chmod +x /root/geth.sh
RUN chmod +x /root/geth-init.sh
RUN /root/geth-init.sh

ENTRYPOINT /root/geth.sh
