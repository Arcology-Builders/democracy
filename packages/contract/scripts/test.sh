#!/bin/sh

NODE_ENV=DEVELOPMENT ./bin/linker.js DifferentSender
NODE_ENV=DEVELOPMENT ./bin/deployer.js DifferentSender
