#! /bin/bash

# Exit on errors
set -e

if [[ $TRAVIS_COMMIT_MESSAGE == Babel\ Build:* ]]; then
  echo "Ignoring automated build."
  exit 0
fi

if [ "$TRAVIS_NODE_VERSION" == "4" ]; then
  printf "Installing Latest npm\n"
  npm i -g npm
  printf "npm Version: "
  npm -v
  printf "\n\n"
fi