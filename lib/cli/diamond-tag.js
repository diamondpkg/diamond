'use strict';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const log = require('npmlog');
const config = require('../functions/loadConfig');
const superagent = require('superagent');

log.heading = 'dia';

fs.ensureDirSync(path.join(os.homedir(), '.diamond'));
if (!fs.existsSync(path.join(os.homedir(), '.diamond/auth.json'))) fs.writeFileSync(path.join(os.homedir(), '.diamond/auth.json'), JSON.stringify({}));
const auth = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.diamond/auth.json')));

exports.command = 'tag <set|rm|ls> <pkg> [tag] [version]';
exports.desc = 'Sets, removes, or lists tags';
exports.builder = {};

exports.handler = args => {
  const cmd = args.set;

  if (cmd === 'ls') {
    superagent.get(`${config.registry}/package/${args.pkg}`).then(res => {
      for (const tag in res.body.tags) {
        process.stdout.write(`${tag}: ${res.body.tags[tag]}\n`);
      }
    }).catch(res => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
  } else if (cmd === 'set') {
    if (!auth) {
      log.error('not logged in', 'please run \'diamond login\'');
      process.exit(1);
    }

    superagent.post(`${config.registry}/package/${args.pkg}/tag/${args.tag}`).auth(auth.username, auth.password).send({ version: args.version }).catch(res => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
  } else if (cmd === 'rm') {
    if (!auth) {
      log.error('not logged in', 'please run \'diamond login\'');
      process.exit(1);
    }

    superagent.del(`${config.registry}/package/${args.pkg}/tag/${args.tag}`).auth(auth.username, auth.password).catch(res => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
  } else {
    log.error('invalid action', cmd);
    process.exit(1);
  }
};