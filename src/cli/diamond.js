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
  .parse(process.argv);
