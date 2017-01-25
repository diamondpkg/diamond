#! /usr/bin/env node

'use strict';

const program = require('commander');


program
  .version('0.1.0')
  .command('install [packages...]', 'install one or more packages', { isDefault: true })
  .command('login', 'logs you in to GitHub with OAuth2, optional but recommended')
  .parse(process.argv);
