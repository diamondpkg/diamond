#! /usr/bin/env node

'use strict';

// require('../functions/error');

const yargs = require('yargs');

yargs.usage('$0 command') // eslint-disable-line no-unused-expressions
  .commandDir('.')
  .demand(1, 'must provide a valid command')
  .help('h')
  .alias('h', 'help')
  .argv;
