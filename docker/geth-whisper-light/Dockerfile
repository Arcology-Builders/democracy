FROM cryptogoth/geth-base:48ef43e
MAINTAINER Paul Pham

ENTRYPOINT ssh-keygen -t rsa -f ~/.ssh/id_rsa -N "" &&                              \
  geth --rinkeby --syncmode=light                                                   \
    --shh --shh.maxmessagesize 10000 --shh.pow 2                                    \
    --ws --wsaddr=0.0.0.0 --wsorigins="*" --wsapi=web3,shh,net          \
    --rpc --rpcaddr=0.0.0.0 --rpcport=8545 --rpcapi=web,shh,net --rpccorsdomain="*" \
    --rpcvhosts="*"

EXPOSE 8546
