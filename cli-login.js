const os = require('os');
const path = require('path');
const opn = require('opn');
const log = require('npmlog');
const fs = require('fs-extra');
const stdio = require('stdio');
const superagent = require('superagent');

log.heading = 'dia';
log.info('it worked if it ends with', 'ok');

opn('https://github.com/settings/tokens/new');
log.info('please go to', 'https://github.com/settings/tokens/new', 'and make a new personal access token');

function getToken() {
  stdio.question('Please enter your new personal access token', (err, token) => {
    if (err) {
      log.error('error while getting text input', err);
      log.error('not ok');
      process.exit(1);
    }

    superagent.get('https://api.github.com/rate_limit')
      .set('Authorization', `Bearer ${token}`)
      .then(() => {
        fs.ensureFileSync(path.join(os.homedir(), '.diamond/config.json'));

        let config;
        try {
          config = JSON.parse(path.join(os.homedir(), '.diamond/config.json'));
        } catch (error) {
          config = {};
        }

        config.githubKey = token;

        fs.writeFileSync(path.join(os.homedir(), '.diamond/config.json'), JSON.stringify(config));

        log.info('ok');
        process.exit(0);
      })
      .catch(() => {
        log.error('invalid token');
        getToken();
      });
  });
}

getToken();
