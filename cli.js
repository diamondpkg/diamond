#! /usr/bin/env node

'use strict';

const semver = require('semver');

if (semver.satisfies(process.version, '>=7.6.0')) {
  require('./src/cli/diamond');
} else {
  require('./lib/cli/diamond');
}
