/* global cli:false */

'use strict';

const fs = require('fs-extra');
const compileSass = require('./sass');
const compileLess = require('./less');
const compileStyl = require('./stylus');
const log = require('npmlog');
const co = require('co');

log.heading = 'dia';

module.exports = co.wrap(function* fn(filename, options) {
  yield fs.ensureDir('./diamond/packages');
  yield fs.ensureFile('./diamond/.internal/packages.lock');

  if (!options) options = {};

  const data = yield fs.readFile(filename, 'utf8');

  if (/\.sass|\.scss/.test(filename)) {
    return yield compileSass(data, filename, options);
  } else if (/\.less/.test(filename)) {
    return yield compileLess(data, filename, options);
  } else if (/\.styl/.test(filename)) {
    return yield compileStyl(data, filename, options);
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

module.exports.sass = co.wrap(function* fn(data, options) {
  yield fs.ensureDir('./diamond/packages');
  yield fs.ensureFile('./diamond/.internal/packages.lock');

  if (!options) options = {};

  return yield compileSass(data, options.filename, options);
});

module.exports.less = co.wrap(function* fn(data, options) {
  yield fs.ensureDir('./diamond/packages');
  yield fs.ensureFile('./diamond/.internal/packages.lock');

  if (!options) options = {};

  return yield compileLess(data, options.filename, options);
});


module.exports.stylus = co.wrap(function* fn(data, options) {
  yield fs.ensureDir('./diamond/packages');
  yield fs.ensureFile('./diamond/.internal/packages.lock');

  if (!options) options = {};

  return yield compileStyl(data, options.filename, options);
});

module.exports.styl = module.exports.stylus;
module.exports.scss = module.exports.sass;
