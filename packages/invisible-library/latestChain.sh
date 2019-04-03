#!/bin/sh

LATEST=$(ls deploys | tail -n 1)
if [ ! -e deploys/latest ] ; then
  cd deploys; ln -s $LATEST ./latest
fi
