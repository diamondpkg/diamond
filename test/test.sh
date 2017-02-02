#! /bin/bash

# Exit on errors
set -e

# Check dependencies
printf "Checking dependencies\n"
depcheck --ignores=eslint,eslint-config-airbnb,eslint-plugin-import,eslint-plugin-jsx-a11y,eslint-plugin-react

# Install
printf "\n\nInstalling bootstrap@4.0.0-alpha.2\n"
diamond install bootstrap@4.0.0-alpha.2

# Test
printf "\n\nCompiling...\n"
output=$(diamond c test/test.sass)
if [ $? -eq 0 ]; then
    printf ""
else
    printf "\n$output"
fi