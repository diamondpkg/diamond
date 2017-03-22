'use strict';

const Registry = require('npm-registry-client');
const userAgent = require('../../misc/userAgent');
const semver = require('semver');
const log = require('npmlog');

function noop() { }

const registry = new Registry({
  userAgent: userAgent.registry,
  log: {
    error: log.error,
    warn: log.warn,
    info: noop,
    verbose: noop,
    silly: noop,
    http: noop,
    pause: noop,
    resume: noop,
  },
});

module.exports = (packages, pkg) => new Promise((resolve) => {
  registry.get(`https://registry.npmjs.org/${pkg.name}`, {}, (err, data) => {
    if (err) {
      log.disableProgress();
      log.resume();
      if (err.message) log.error('registry', err.message);
      else throw err;
      log.error('not ok');
      process.exit(1);
    }

    let version;
    if (pkg.source.tag && data['dist-tags'][pkg.source.tag] && data.versions[data['dist-tags'][pkg.source.tag]]) {
      version = data.versions[data['dist-tags'][pkg.source.tag]];
    } else if (pkg.source.tag) {
      log.disableProgress();
      log.resume();
      log.error(`invalid tag ${pkg.source.tag}`, pkg.name);
      log.error('not ok');
      process.exit(1);
    } else {
      const versions = Object.keys(data.versions)
        .filter(v => semver.satisfies(v, pkg.version))
        .sort(semver.compare)
        .reverse();
      if (versions.length) {
        version = data.versions[versions[0]];
      } else {
        log.disableProgress();
        log.resume();
        log.error(`no versions match ${pkg.version}`, pkg.name);
        log.error('not ok');
        process.exit(1);
      }
    }

    resolve([version, version.dist.tarball, version.dist.shasum]);
  });
});
