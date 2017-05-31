#! /usr/bin/env node

'use strict';

const log = require('npmlog');
const yargs = require('yargs');
const version = require('../../package.json').version;

log.heading = 'dia';
global.cli = true;

yargs.usage('$0 command') // eslint-disable-line no-unused-expressions
  .commandDir('.')
  .demand(1, 'must provide a valid command')
  .help('h')
  .alias('h', 'help')
  .version(version)
  .argv;

process.on('unhandledRejection', (error) => {
  log.resume();
  log.error('error', 'Error');
  log.error('error', `  ${error.stack}`);
  log.error('error');
  log.error('error', 'System Information');
  log.error('error', `  Node Version: ${process.version}`);
  log.error('error', `      Platform: ${process.platform}`);
  log.error('error', `       Version: ${version}`);
  log.error('error');
  log.error('error', 'You have encountered an error, please report the information above to the diamond team.');
  log.error('error', 'You can make a new issue here https://github.com/diamondpkg/diamond/issues/new');
});

process.on('uncaughtException', (error) => {
  log.resume();
  log.error('error', 'Error');
  log.error('error', `  ${error.stack}`);
  log.error('error');
  log.error('error', 'System Information');
  log.error('error', `  Node Version: ${process.version}`);
  log.error('error', `      Platform: ${process.platform}`);
  log.error('error', `       Version: ${version}`);
  log.error('error');
  log.error('error', 'You have encountered an error, please report the information above to the diamond team.');
  log.error('error', 'You can make a new issue here https://github.com/diamondpkg/diamond/issues/new');
});
