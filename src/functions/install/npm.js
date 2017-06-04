'use strict';

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const userAgent = require('../../misc/userAgent');
const superagent = require('superagent');
const semver = require('semver');
const log = require('npmlog');

module.exports = function* fn(packages, pkg) {
  yield fs.ensureDir(path.join(os.homedir(), '.diamond/package-cache/npm'));

  let info;
  try {
    if (global.offline) throw new Error('offline');
    info = (yield superagent.get(`https://registry.npmjs.org/${pkg.name}`).set(userAgent.superagent)).body;
  } catch (err) {
    if (yield fs.pathExists(path.join(os.homedir(), '.diamond/package-cache/npm', `${pkg.name}.json`))) {
      info = JSON.parse(yield fs.readFile(path.join(os.homedir(), '.diamond/package-cache/npm', `${pkg.name}.json`)));
    } else {
      log.disableProgress();
      log.resume();
      if (err.status) log.error(`registry error: ${err.status}`, pkg.name);
      else throw err;
      log.error('not ok');
      process.exit(1);
    }
  }

  yield fs.writeFile(path.join(os.homedir(), '.diamond/package-cache/npm', `${pkg.name}.json`), JSON.stringify(info));

  let version;
  if (pkg.source.tag && info['dist-tags'][pkg.source.tag] && info.versions[info['dist-tags'][pkg.source.tag]]) {
    version = info.versions[info['dist-tags'][pkg.source.tag]];
  } else if (pkg.source.tag) {
    log.disableProgress();
    log.resume();
    log.error(`invalid tag ${pkg.source.tag}`, pkg.name);
    log.error('not ok');
    process.exit(1);
  } else {
    const versions = Object.keys(info.versions)
      .filter(v => semver.satisfies(v, pkg.version))
      .sort(semver.compare)
      .reverse();
    if (versions.length) {
      version = info.versions[versions[0]];
    } else {
      log.disableProgress();
      log.resume();
      log.error(`no versions match ${pkg.version}`, pkg.name);
      log.error('not ok');
      process.exit(1);
    }
  }

  return [version, version.dist.tarball, version.dist.shasum];
};
