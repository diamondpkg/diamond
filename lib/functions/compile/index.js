/* global cli:false */

'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const fs = require('fs-extra');
const compileSass = require('./sass');
const compileLess = require('./less');
const compileStyl = require('./stylus');
const log = require('npmlog');

log.heading = 'dia';

module.exports = (() => {
  var _ref = _asyncToGenerator(function* (file, options) {
    yield fs.ensureDir('./diamond/packages');
    yield fs.ensureFile('./diamond/.internal/packages.lock');

    if (/\.sass|\.scss/.test(file)) {
      return compileSass(file, options);
    } else if (/\.less/.test(file)) {
      return compileLess(file, options);
    } else if (/\.styl/.test(file)) {
      return compileStyl(file, options);
    } else if (cli) {
      log.resume();
      log.error('unsupported file type');
      log.error('not ok');
      process.exit(1);
    } else {
      throw new Error('unsupported file type');
    }

    return undefined;
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();