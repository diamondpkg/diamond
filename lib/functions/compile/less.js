/* global cli:false */

'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const less = require('less');
const path = require('path');
const log = require('npmlog');
const fs = require('fs-extra');
const plugin = require('../../importers');

module.exports = (() => {
  var _ref = _asyncToGenerator(function* (filename) {
    let packageJson;
    try {
      packageJson = JSON.parse((yield fs.readFile('./diamond.json')));
    } catch (err) {
      packageJson = {};
      if (cli) log.info('no diamond.json found');
    }

    const plugins = [plugin.less];

    if (packageJson && packageJson.unify) {
      plugins.push(require(path.join(process.cwd(), packageJson.unify)).less);
    }

    let result;
    try {
      result = yield less.render((yield fs.readFile(filename, 'utf8')), { filename, plugins });
    } catch (error) {
      if (cli) {
        log.disableProgress();
        log.resume();
        log.error('less', error.message);
        log.error('less', error.stack);
        log.error('not ok');
        process.exit(1);
      } else throw error;
    }

    return result.css.toString();
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();