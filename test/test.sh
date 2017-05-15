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

# Install
printf "\n\nInstalling npm:bootstrap@4.0.0-alpha.6\n"
diamond install npm:bootstrap@4.0.0-alpha.6 --no-save

# Test
printf "Compiling Sass..."
output=$(diamond c test/bootstrap.sass)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Less..."
output=$(diamond c test/bootstrap.less)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Styl..."
output=$(diamond c test/bootstrap.styl)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m\n"
else
    printf "\n$output"
fi

# Install
printf "\n\nInstalling npm:bootstrap@4.0.0-alpha.6 (uncached)\n"
diamond install npm:bootstrap@4.0.0-alpha.6 --no-cache --no-save

# Test
printf "Compiling Sass..."
output=$(diamond c test/bootstrap.sass)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Less..."
output=$(diamond c test/bootstrap.less)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Styl..."
output=$(diamond c test/bootstrap.styl)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m\n"
else
    printf "\n$output"
fi

# Install
printf "\n\nInstalling npm:bootstrap@3.3.7\n"
diamond install npm:bootstrap@3.3.7 --no-save

# Test
printf "Compiling Sass..."
output=$(diamond c test/bootstrap.sass)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Less..."
output=$(diamond c test/bootstrap.less)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Styl..."
output=$(diamond c test/bootstrap.styl)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m\n"
else
    printf "\n$output"
fi

# Install
printf "\n\nInstalling npm:bootstrap@3.3.7 (uncached)\n"
diamond install npm:bootstrap@3.3.7 --no-cache --no-save

# Test
printf "Compiling Sass..."
output=$(diamond c test/bootstrap.sass)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Less..."
output=$(diamond c test/bootstrap.less)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Styl..."
output=$(diamond c test/bootstrap.styl)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m\n"
else
    printf "\n$output"
fi

printf "\n\n\033[0;32mTests Complete!\033[0m\n"