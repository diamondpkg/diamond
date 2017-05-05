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

program
  .command('tag <set|rm|ls> <pkg> [tag] [version]', 'Sets, removes, or lists tags');

program
  .command('author <add|rm|ls> <pkg> [username]', 'Adds, removes, or lists authors');

program
  .command('login', 'Logs you in or registers');

program
  .command('config <set|get|rm|ls> [key] [value]', 'Manages your global diamond config');

program.parse(process.argv);

