#!/bin/sh

NODE_ENV=DEVELOPMENT ./bin/linker.js DifferentSender link
NODE_ENV=DEVELOPMENT ./bin/deployer.js DifferentSender link deploy
