FROM cryptogoth/geth
MAINTAINER Paul Pham

ADD ./private.sh /root/private.sh
ADD ./CustomGenesis.json /root/CustomGenesis.json
RUN chmod +x /root/private.sh

CMD /root/private.sh
