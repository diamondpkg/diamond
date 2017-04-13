const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const uuid = require('uuid/v4');
const osName = require('os-name');
const Analytics = require('analytics-node');

fs.ensureDirSync(path.join(os.homedir(), '.diamond'));
if (!fs.existsSync(path.join(os.homedir(), '.diamond/config.json'))) fs.writeFileSync(path.join(os.homedir(), '.diamond/config.json'), JSON.stringify({ save: true, cache: true, tid: uuid() }));
const config = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.diamond/config.json')));

exports.analytics = new Analytics('JeyUNRkMNG7oY0AfojuazZmFKTreL3Wn');

exports.id = config.tid;

exports.init = (command) => {
  exports.analytics.identify({
    userId: exports.id,
    traits: {
      arch: os.arch(),
      osName: osName(os.platform(), os.release()),
      osRelease: os.release(),
      osType: os.platform(),
      nodeVersion: process.version,
      version: require('../../package.json').version,
    },
  });

  exports.analytics.track({
    userId: exports.id,
    event: 'Command',
    properties: {
      name: command,
    },
  });
};
