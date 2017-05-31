#! /bin/bash

# Exit on errors
set -e

if [ "$TRAVIS_NODE_VERSION" == "4" ]; then
  printf "Installing Latest npm\n"
  npm i -g npm
  printf "npm Version: "
  npm -v
  printf "\n\n"
fi