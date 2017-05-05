'use strict';

require('../functions/loadConfig');
const os = require('os');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const log = require('npmlog');
const path = require('path');
const program = require('commander');
const version = require('../../package.json').version;

program
  .version(version)
  .parse(process.argv);

log.heading = 'dia';

const config = yaml.safeLoad(fs.readFileSync(path.join(os.homedir(), '.diamond/config.yml')));

if (program.args[0] === 'ls') {
  process.stdout.write(`${fs.readFileSync(path.join(os.homedir(), '.diamond/config.yml'))}\n`);
} else if (program.args[0] === 'get') {
  process.stdout.write(`${config[program.args[1]]}\n`);
} else if (program.args[0] === 'set') {
  config[program.args[1]] = program.args[2] || null;
  fs.writeFileSync(path.join(os.homedir(), '.diamond/config.yml'), yaml.safeDump(config));
  process.stdout.write(`${config[program.args[1]]}\n`);
} else if (program.args[0] === 'rm') {
  delete config[program.args[1]];
  fs.writeFileSync(path.join(os.homedir(), '.diamond/config.yml'), yaml.safeDump(config));
} else {
  log.error('invalid action', program.args[0]);
  process.exit(1);
}
