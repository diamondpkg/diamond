'use strict';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const log = require('npmlog');
const program = require('commander');
const config = require('../functions/loadConfig');
const superagent = require('superagent');
const version = require('../../package.json').version;

log.heading = 'dia';

fs.ensureDirSync(path.join(os.homedir(), '.diamond'));
if (!fs.existsSync(path.join(os.homedir(), '.diamond/auth.json'))) fs.writeFileSync(path.join(os.homedir(), '.diamond/auth.json'), JSON.stringify({}));
const auth = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.diamond/auth.json')));

program
  .version(version)
  .parse(process.argv);

if (program.args[0] === 'ls') {
  superagent.get(`${config.registry}/package/${program.args[1]}`)
    .then((res) => {
      for (const tag in res.body.tags) {
        process.stdout.write(`${tag}: ${res.body.tags[tag]}\n`);
      }
    })
    .catch((res) => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
} else if (program.args[0] === 'set') {
  if (!auth) {
    log.error('not logged in', 'please run \'diamond login\'');
    process.exit(1);
  }

  superagent.post(`${config.registry}/package/${program.args[1]}/tag/${program.args[2]}`)
    .auth(auth.username, auth.password)
    .send({ version: program.args[3] })
    .catch((res) => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
} else if (program.args[0] === 'rm') {
  if (!auth) {
    log.error('not logged in', 'please run \'diamond login\'');
    process.exit(1);
  }

  superagent.del(`${config.registry}/package/${program.args[1]}/tag/${program.args[2]}`)
    .auth(auth.username, auth.password)
    .catch((res) => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
} else {
  log.error('invalid action', program.args[0]);
  process.exit(1);
}
