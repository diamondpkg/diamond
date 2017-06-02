#! /usr/bin/env node

'use strict';

const semver = require('semver');

if (semver.satisfies(process.version, '>=7.6.0')) {
  module.exports = require('./src/exports');
} else {
  module.exports = require('./lib/exports');
}
