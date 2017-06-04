/* global cli:false */

'use strict';

const fs = require('fs-extra');
const compileSass = require('./sass');
const compileLess = require('./less');
const compileStyl = require('./stylus');
const log = require('npmlog');
const co = require('co');

log.heading = 'dia';

module.exports = co.wrap(function* fn(file, options) {
  yield fs.ensureDir('./diamond/packages');
  yield fs.ensureFile('./diamond/.internal/packages.lock');

  if (/\.sass|\.scss/.test(file)) {
    return yield compileSass(file, options);
  } else if (/\.less/.test(file)) {
    return yield compileLess(file, options);
  } else if (/\.styl/.test(file)) {
    return yield compileStyl(file, options);
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
