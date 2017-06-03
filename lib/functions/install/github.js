'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const superagent = require('superagent');
const userAgent = require('../../misc/userAgent');
const log = require('npmlog');

module.exports = (() => {
  var _ref = _asyncToGenerator(function* (packages, pkg) {
    let info;
    try {
      info = JSON.parse((yield superagent.get(`https://raw.githubusercontent.com/${pkg.source.owner}/${pkg.source.repo}/${pkg.source.ref}/diamond.json`).set(userAgent.superagent)).text);
    } catch (error) {
      if (error.status === 404) {
        try {
          info = JSON.parse((yield superagent.get(`https://raw.githubusercontent.com/${pkg.source.owner}/${pkg.source.repo}/${pkg.source.ref}/package.json`).set(userAgent.superagent)).text);
        } catch (err) {
          if (err.status !== 404) {
            log.disableProgress();
            log.resume();
            if (err.status) log.error(`error downloading package.json: ${err.status}`, pkg.name);else throw err;
            log.error('not ok');
            process.exit(1);
          }
        }
      } else {
        log.disableProgress();
        log.resume();
        if (error.status) log.error(`error downloading diamond.json: ${error.status}`, pkg.name);else throw error;
        log.error('not ok');
        process.exit(1);
      }
    }

    return [info, `https://github.com/${pkg.source.owner}/${pkg.source.repo}/archive/${pkg.source.ref}.tar.gz`];
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();