#! /usr/bin/env node

'use strict';

const program = require('commander');


program
  .version(require('../../package.json').version);

program
  .command('install [packages...]')
  .alias('i')
  .description('install one or more packages')
  .action(require('./install'));

program
  .command('compile [args...]', 'compile SASS with the diamond importer, all args are passed to node-sass');

program
  .parse(process.argv);
