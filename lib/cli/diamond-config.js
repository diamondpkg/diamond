'use strict';

require('../functions/loadConfig');
const os = require('os');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const log = require('npmlog');
const path = require('path');

log.heading = 'dia';

exports.command = 'config <set|get|rm|ls> [key] [value]';
exports.desc = 'Manages your global diamond config';
exports.builder = {};

exports.handler = args => {
  const cmd = args.set;
  const config = yaml.safeLoad(fs.readFileSync(path.join(os.homedir(), '.diamond/config.yml')));

  if (cmd === 'ls') {
    process.stdout.write(`${fs.readFileSync(path.join(os.homedir(), '.diamond/config.yml'))}\n`);
  } else if (cmd === 'get') {
    process.stdout.write(`${config[args.key]}\n`);
  } else if (cmd === 'set') {
    config[args.key] = args.value || null;
    fs.writeFileSync(path.join(os.homedir(), '.diamond/config.yml'), yaml.safeDump(config));
    process.stdout.write(`${config[args.key]}\n`);
  } else if (cmd === 'rm') {
    delete config[args.key];
    fs.writeFileSync(path.join(os.homedir(), '.diamond/config.yml'), yaml.safeDump(config));
  } else {
    log.error('invalid action', cmd);
    process.exit(1);
  }
};