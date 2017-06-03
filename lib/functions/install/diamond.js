'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const userAgent = require('../../misc/userAgent');
const superagent = require('superagent');
const semver = require('semver');
const log = require('npmlog');
const config = require('../loadConfig');

module.exports = (() => {
  var _ref = _asyncToGenerator(function* (packages, pkg) {
    let res;
    try {
      res = yield superagent.get(`${config.registry}/package/${pkg.name}`).set(userAgent.superagent);
    } catch (err) {
      log.disableProgress();
      log.resume();
      if (err.status) log.error(`registry error: ${err.status}`, pkg.name);else throw err;
      log.error('not ok');
      process.exit(1);
    }

    let version;
    if (pkg.source.tag && res.body.tags[pkg.source.tag] && res.body.versions[res.body.tags[pkg.source.tag]]) {
      version = res.body.versions[res.body.tags[pkg.source.tag]];
    } else if (pkg.source.tag) {
      log.disableProgress();
      log.resume();
      log.error(`invalid tag ${pkg.source.tag}`, pkg.name);
      log.error('not ok');
      process.exit(1);
    } else {
      const versions = Object.keys(res.body.versions).filter(function (v) {
        return semver.satisfies(v, pkg.version);
      }).sort(semver.compare).reverse();
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
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();