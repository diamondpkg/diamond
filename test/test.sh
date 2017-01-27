# Exit on errors
set -e

# Check dependencies
printf "Checking dependencies\n"
depcheck --ignores=eslint,eslint-config-airbnb,eslint-plugin-import,eslint-plugin-jsx-a11y,eslint-plugin-react

# Install
printf "\n\nInstalling bootstrap@4.0.0-alpha.2\n"
diamond install bootstrap@4.0.0-alpha.2

# Test
printf "\n\nCompiling..."
output=$(node-sass --importer diamond test/test.sass)
if [ $? -eq 0 ]; then
    printf " OK"
else
    printf "\n$output"
fi