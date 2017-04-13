'use strict';

const os = require('os');
const fs = require('fs-extra');
const log = require('npmlog');
const path = require('path');
const program = require('commander');
const version = require('../../package.json').version;
const analytics = require('../functions/analytics');

analytics.init('install');

program
  .version(version)
  .option('--show', 'Show the config')
  .option('--save [bool]', 'Save packages in your package.json', null)
  .option('--cache [bool]', 'Pull packages from the package cache', null)
  .parse(process.argv);

log.heading = 'dia';

const defaults = { save: true, cache: true };

fs.ensureDirSync(path.join(os.homedir(), '.diamond'));
if (!fs.existsSync(path.join(os.homedir(), '.diamond/config.json'))) fs.writeFileSync(path.join(os.homedir(), '.diamond/config.json'), JSON.stringify(defaults));

if (program.show) {
  const config = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.diamond/config.json')));
  for (const key in config) {
    log.info(key, config[key]);
  }
} else {
  const config = {};

  if (program.save !== null) {
    if (program.save === 'true') config.save = true;
    else if (program.save === 'false') config.save = false;
    else config.save = defaults.save;
    log.info('save', config.save);
  }

  if (program.cache !== null) {
    if (program.cache === 'true') config.cache = true;
    else if (program.cache === 'false') config.cache = false;
    else config.cache = defaults.cache;
    log.info('cache', config.cache);
  }

  fs.writeFileSync(path.join(os.homedir(), '.diamond/config.json'), JSON.stringify(Object.assign(defaults, JSON.parse(fs.readFileSync(path.join(os.homedir(), '.diamond/config.json'))), config)));
}
