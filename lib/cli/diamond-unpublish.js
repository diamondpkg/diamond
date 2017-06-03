'use strict';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const log = require('npmlog');
const config = require('../functions/loadConfig');
const superagent = require('superagent');

log.heading = 'dia';

exports.command = 'unpublish <pkg> [version]';
exports.desc = 'Unpublishes a version or a whole package';
exports.builder = {};

exports.handler = args => {
  fs.ensureDirSync(path.join(os.homedir(), '.diamond'));
  if (!fs.existsSync(path.join(os.homedir(), '.diamond/auth.json'))) fs.writeFileSync(path.join(os.homedir(), '.diamond/auth.json'), JSON.stringify({}));
  const auth = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.diamond/auth.json')));

  if (!auth) {
    log.error('not logged in', 'please run \'diamond login\'');
    process.exit(1);
  }

  if (args.version) {
    superagent.del(`${config.registry}/package/${args.pkg}/${args.version}`).auth(auth.username, auth.password).then(() => {
      process.stdout.write(`- ${args.pkg}@${args.version}\n`);
    }).catch(res => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
  } else {
    superagent.del(`${config.registry}/package/${args.pkg}`).auth(auth.username, auth.password).then(() => {
      process.stdout.write(`- ${args.pkg}\n`);
    }).catch(res => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
  }
};