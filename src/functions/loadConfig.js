'use strict';

const os = require('os');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const log = require('npmlog');
const path = require('path');

log.heading = 'dia';

const defaults = { registry: 'https://registry.diamondpkg.org' };

fs.ensureDirSync(path.join(os.homedir(), '.diamond'));
if (!fs.existsSync(path.join(os.homedir(), '.diamond/config.yml'))) fs.writeFileSync(path.join(os.homedir(), '.diamond/config.yml'), '');
let glo = yaml.safeLoad(fs.readFileSync(path.join(os.homedir(), '.diamond/config.yml')));
if (!glo) glo = {};

let local = {};
if (fs.existsSync(path.join(process.cwd(), 'diamond-config.yml'))) local = yaml.safeLoad(fs.readFileSync(path.join(process.cwd(), 'diamond-config.yml')));

module.exports = Object.assign(defaults, glo, local);

