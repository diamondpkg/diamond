/* global cli:false */

'use strict';

const fs = require('fs-extra');
const compileSass = require('./sass');
const compileLess = require('./less');
const compileStyl = require('./stylus');
const log = require('npmlog');

log.heading = 'dia';

module.exports = (file, options) => new Promise((resolve, reject) => {
  fs.ensureDirSync('./diamond/packages');
  fs.ensureFileSync('./diamond/.internal/packages.lock');

  let promise;
  if (/\.sass|\.scss/.test(file)) {
    promise = compileSass(file, options);
  } else if (/\.less/.test(file)) {
    promise = compileLess(file, options);
  } else if (/\.styl/.test(file)) {
    promise = compileStyl(file, options);
  } else if (cli) {
    log.resume();
    log.error('unsupported file type');
    log.error('not ok');
    process.exit(1);
  } else {
    reject(new Error('unsupported file type'));
  }

  promise.then((css) => {
    resolve(css);
  })
  .catch(e => reject(e));
});
