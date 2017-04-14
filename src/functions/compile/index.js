'use strict';

const fs = require('fs-extra');
const compileSass = require('./sass');
const compileLess = require('./less');

module.exports = (file, options) => new Promise((resolve) => {
  fs.ensureDirSync('./diamond/packages');
  fs.ensureFileSync('./diamond/.internal/packages.lock');

  console.error('hi'); //eslint-disable-line

  let promise;
  if (/\.sass|\.scss/.test(file)) {
    promise = compileSass(file, options);
  } else if (/\.less/.test(file)) {
    promise = compileLess(file);
  }

  promise.then((css) => {
    resolve(css);
  });
});
