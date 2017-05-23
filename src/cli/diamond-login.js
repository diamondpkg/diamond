'use strict';

const os = require('os');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const prompt = require('prompt');
const config = require('../functions/loadConfig');
const superagent = require('superagent');

log.heading = 'dia';

fs.ensureDirSync(path.join(os.homedir(), '.diamond'));

exports.command = 'login';
exports.desc = 'Logs you in or registers';
exports.builder = {};

exports.handler = () => {
  prompt.start();
  prompt.get([
    { name: 'username', required: true },
  ], (err, result) => {
    if (err) throw err;

    superagent.get(`${config.registry}/user/${result.username}`)
      .then(() => {
        prompt.get([
          { name: 'password', required: true, hidden: true },
        ], (e, resu) => {
          if (e) throw e;

          superagent.get(`${config.registry}/user`)
            .auth(result.username, resu.password)
            .then((res) => {
              const auth = {
                username: res.body.username, email: res.body.email, password: resu.password,
              };
              fs.writeFileSync(path.join(os.homedir(), '.diamond/auth.json'), JSON.stringify(auth));
              log.info('logged in', `as ${res.body.username}`);
            }).catch((res) => {
              throw res;
            });
        });
      })
      .catch((res) => {
        if (res.status !== 404) throw res;

        prompt.get([
          { name: 'email', required: true },
          { name: 'password', required: true, hidden: true },
          { name: 'verify password', required: true, hidden: true },
        ], (e, resu) => {
          if (e) throw e;

          if (resu.password !== resu['verify password']) {
            log.error('passwords do not match');
            process.exit(1);
          }

          superagent.post(`${config.registry}/user`)
            .send(Object.assign({}, result, resu))
            .then((r) => {
              const auth = {
                username: r.body.username, email: r.body.email, password: resu.password,
              };
              fs.writeFileSync(path.join(os.homedir(), '.diamond/auth.json'), JSON.stringify(auth));
              log.info('registered', `as ${r.body.username}`);
              log.info('check your email for a verification email');
            })
            .catch((r) => {
              throw r;
            });
        });
      });
  });
};
