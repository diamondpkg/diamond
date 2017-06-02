/* global cli:false */

'use strict';

const fs = require('fs-extra');
const compileSass = require('./sass');
const compileLess = require('./less');
const compileStyl = require('./stylus');
const log = require('npmlog');

log.heading = 'dia';

module.exports = async (file, options) => {
  await fs.ensureDir('./diamond/packages');
  await fs.ensureFile('./diamond/.internal/packages.lock');

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
};
