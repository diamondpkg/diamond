#! /usr/bin/env node

'use strict';

require('../functions/error');

const program = require('commander');

program.version(require('../../package.json').version);

program
  .command('install [packages...]', 'install one or more packages')
  .alias('i');

program
  .command('uninstall [packages...]', 'uninstall one or more packages')
  .alias('u');

program
  .command('compile <file>', 'compile a file')
  .alias('c');

program.parse(process.argv);

