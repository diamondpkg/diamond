#! /usr/bin/env node

'use strict';

const program = require('commander');


program
  .version(require('../../package.json').version)
  .command('install [packages...]', 'install one or more packages')
  .command('i [packages...]', 'install one or more packages')
  .command('compile <file>', 'compile a Sass file')
  .command('c <file>', 'compile a Sass file')
  .command('login', 'login to GitHub')
  .command('config', 'sets the config')
  .parse(process.argv);
