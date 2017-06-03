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

exports.command = 'author <add|rm|ls> <pkg> [username]';
exports.desc = 'Adds, removes, or lists authors';
exports.builder = {};

exports.handler = args => {
  const cmd = args.add;

  if (cmd === 'ls') {
    superagent.get(`${config.registry}/package/${args.pkg}`).then(res => {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = res.body.authors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          const user = _step.value;

          process.stdout.write(`${user.username} <${user.email}>\n`);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }).catch(res => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
  } else if (cmd === 'add') {
    if (!auth) {
      log.error('not logged in', 'please run \'diamond login\'');
      process.exit(1);
    }

    superagent.post(`${config.registry}/package/${args.pkg}/author/${args.username}`).auth(auth.username, auth.password).catch(res => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
  } else if (cmd === 'rm') {
    if (!auth) {
      log.error('not logged in', 'please run \'diamond login\'');
      process.exit(1);
    }

    superagent.del(`${config.registry}/package/${args.pkg}/author/${args.username}`).auth(auth.username, auth.password).catch(res => {
      log.http(res.status, res.response.body.message);
      process.exit(1);
    });
  } else {
    log.error('invalid action', cmd);
    process.exit(1);
  }
};