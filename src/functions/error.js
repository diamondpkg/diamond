const os = require('os');
const osName = require('os-name');
const raven = require('raven');
const log = require('npmlog');

log.heading = 'dia';

raven.config('https://b3e855ffb6214bacad64c30ecd947b0b:92764259e54c4501821c339ba95b52af@sentry.io/158014', {
  release: require('../../package.json').version,
  captureUnhandledRejections: true,
  extra: {
    arch: os.arch(),
    osName: osName(os.platform(), os.release()),
    osRelease: os.release(),
    osType: os.platform(),
    nodeVersion: process.version,
  },
}).install(() => {
  log.error('internal error', 'this error has been forwarded to the diamond team');
  log.error('internal error', 'please try again later');
});

raven.disableConsoleAlerts();

exports = raven;
