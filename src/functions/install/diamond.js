'use strict';

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const userAgent = require('../../misc/userAgent');
const superagent = require('superagent');
const semver = require('semver');
const log = require('npmlog');
const config = require('../loadConfig');

module.exports = function* fn(packages, pkg) {
  yield fs.ensureDir(path.join(os.homedir(), '.diamond/package-cache/diamond'));

  let info;
  try {
    if (global.offline) throw new Error('offline');
    info = (yield superagent.get(`${config.registry}/package/${pkg.name}`).set(userAgent.superagent)).body;
  } catch (err) {
    if (yield fs.pathExists(path.join(os.homedir(), '.diamond/package-cache/diamond', `${pkg.name}.json`))) {
      info = JSON.parse(yield fs.readFile(path.join(os.homedir(), '.diamond/package-cache/diamond', `${pkg.name}.json`)));
    } else {
      log.disableProgress();
      log.resume();
      if (err.status) log.error(`registry error: ${err.status}`, pkg.name);
      else throw err;
      log.error('not ok');
      process.exit(1);
    }
  }

  yield fs.writeFile(path.join(os.homedir(), '.diamond/package-cache/diamond', `${pkg.name}.json`), JSON.stringify(info));

  let version;
  if (pkg.source.tag && info.tags[pkg.source.tag]
    && info.versions[info.tags[pkg.source.tag]]) {
    version = info.versions[info.tags[pkg.source.tag]];
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

  version.data._type = 'diamond'; // eslint-disable-line

  return [version.data, version.dist.url, version.dist.shasum];
};
