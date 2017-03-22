'use strict';

const userAgent = require('../../misc/userAgent');
const superagent = require('superagent');
const semver = require('semver');
const log = require('npmlog');

module.exports = (packages, pkg) => new Promise((resolve) => {
  superagent.get(`https://registry.npmjs.org/${pkg.name}`)
    .set(userAgent.superagent)
    .then((res) => {
      let version;
      if (pkg.source.tag && res.body['dist-tags'][pkg.source.tag] && res.body.versions[res.body['dist-tags'][pkg.source.tag]]) {
        version = res.body.versions[res.body['dist-tags'][pkg.source.tag]];
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

      resolve([version, version.dist.tarball, version.dist.shasum]);
    })
    .catch((res) => {
      log.disableProgress();
      log.resume();
      if (res.status) log.error(`registry error: ${res.status}`, pkg.name);
      else throw res;
      log.error('not ok');
      process.exit(1);
    });
});
