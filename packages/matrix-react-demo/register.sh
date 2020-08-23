#!/bin/sh

set -x
HOST="https://cryptogoth.arcology.nyc:443"
#HOST="https://matrix.org"

curl -X POST "${HOST}/_matrix/client/r0/register" \
 -d '{
  "username":"0xd1e3E7825e0451EF12F9063Eb597ed2b62e543Ae",
  "password":"SU06rU,a)",
  "auth": {"type":"m.login.password"}
}'

curl -X GET "${HOST}/_matrix/client/r0/login"

#curl -X POST "${HOST}/_matrix/client/r0/login" \
# -d '{
#  "username":"zk/0xd1e3E7825e0451EF12F9063Eb597ed2b62e543Ae",
#  "password":"password",
#  "auth": {"type":"m.login.dummy"}
#}'


