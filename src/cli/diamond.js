#! /usr/bin/env node

'use strict';

const program = require('commander');


program
  .version('0.1.0');

program
  .command('install [packages...]', 'install one or more packages', { isDefault: true });

program
  .command('compile [args...]', 'compile SASS with the diamond importer, all args are passed to node-sass');

program
  .command('login', 'logs you in to GitHub with OAuth2, optional but recommended')
  .parse(process.argv);
