'use strict';

const os = require('os');
const osName = require('os-name');
const raven = require('raven');
const log = require('npmlog');

log.heading = 'dia';

raven.config('https://f2be20d7c4d84c7fa384e602c0b32103@sentry.io/158014', {
  release: require('../../package.json').version,
  captureUnhandledRejections: true,
  extra: {
    arch: os.arch(),
    osName: osName(os.platform(), os.release()),
    osRelease: os.release(),
    osType: os.platform(),
    nodeVersion: process.version
  }
}).install(() => {
  log.error('internal error', 'this error has been forwarded to the diamond team');
  log.error('internal error', 'please try again later');
});

raven.disableConsoleAlerts();

exports = raven;