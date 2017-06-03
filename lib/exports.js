'use strict';

const compile = require('./functions/compile');
const plugin = require('./importers');

global.cli = false;

module.exports = { compile, plugin };