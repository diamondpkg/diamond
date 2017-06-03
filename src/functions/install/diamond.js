'use strict';

const userAgent = require('../../misc/userAgent');
const superagent = require('superagent');
const semver = require('semver');
const log = require('npmlog');
const config = require('../loadConfig');

module.exports = async (packages, pkg) => {
  let res;
  try {
    res = await superagent.get(`${config.registry}/package/${pkg.name}`).set(userAgent.superagent);
  } catch (err) {
    log.disableProgress();
    log.resume();
    if (err.status) log.error(`registry error: ${err.status}`, pkg.name);
    else throw err;
    log.error('not ok');
    process.exit(1);
  }

  let version;
  if (pkg.source.tag && res.body.tags[pkg.source.tag]
    && res.body.versions[res.body.tags[pkg.source.tag]]) {
    version = res.body.versions[res.body.tags[pkg.source.tag]];
  } else if (pkg.source.tag) {
    log.disableProgress();
    log.resume();
    log.error(`invalid tag ${pkg.source.tag}`, pkg.name);
    log.error('not ok');
    process.exit(1);
  } else {
    const versions = Object.keys(res.body.versions)
      .filter(v => semver.satisfies(v, pkg.version))
      .sort(semver.compare)
      .reverse();
    if (versions.length) {
      version = res.body.versions[versions[0]];
    } else {
      log.disableProgress();
      log.resume();
      log.error(`no versions match ${pkg.version}`, pkg.name);
      log.error('not ok');
      process.exit(1);
    }
  }

  return [version.data, version.dist.url, version.dist.shasum];
};
