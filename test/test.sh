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

# Check dependencies
printf "Checking dependencies\n"
depcheck --ignores=eslint,eslint-config-airbnb,eslint-plugin-import,eslint-plugin-jsx-a11y,eslint-plugin-react

# Install
printf "\n\nInstalling bootstrap@4.0.0-alpha.6\n"
diamond install bootstrap@4.0.0-alpha.6 --no-save

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
    printf " \033[0;32mOK\033[0m\n"
else
    printf "\n$output"
fi

# Install
printf "\n\nInstalling bootstrap@4.0.0-alpha.6 (with namespacing)\n"
diamond install bootstrap@4.0.0-alpha.6 --no-save --no-cache --beta-namespacing

# Test
printf "Compiling Sass..."
output=$(diamond c test/bootstrap.sass)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Sass (with namespacing)..."
output=$(diamond c test/bootstrap-ns.sass)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Less..."
output=$(diamond c test/bootstrap.less)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m\n"
else
    printf "\n$output"
fi

# Install
printf "\n\nInstalling bootstrap@4.0.0-alpha.6 (uncached)\n"
diamond install bootstrap@4.0.0-alpha.6 --no-cache --no-save

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
    printf " \033[0;32mOK\033[0m\n"
else
    printf "\n$output"
fi


# Install
printf "\n\nInstalling bootstrap@3.3.7\n"
diamond install bootstrap@3.3.7 --no-save

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

# Install
printf "\n\nInstalling bootstrap@3.3.7 (uncached)\n"
diamond install bootstrap@3.3.7 --no-cache --no-save

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

# Install
printf "\n\nInstalling ConciseCSS\n"
diamond install ConciseCSS/concise.css --no-save

# Test
printf "Compiling Sass..."
output=$(diamond c test/concise.sass)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi

printf "\nCompiling Less..."
output=$(diamond c test/concise.less)
if [ $? -eq 0 ]; then
    printf " \033[0;32mOK\033[0m"
else
    printf "\n$output"
fi


printf "\n\n\033[0;32mTests Complete!\033[0m\n"