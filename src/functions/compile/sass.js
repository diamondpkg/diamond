'use strict';

const sass = require('node-sass');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const lockfile = require('proper-lockfile');
const importer = require('../../importers/sass');

module.exports = (file, options) => new Promise((resolve) => {
  let packages;
  try {
    packages = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
  } catch (err) {
    packages = [];
  }

  const functions = {};

  packages.filter(o => !!o.functions)
    .forEach((o) => {
      for (const func in o.functions) { //eslint-disable-line
        functions[func] = require(path.join(process.cwd(), 'diamond/packages', o.path, o.functions[func]));
      }
    });

  const importers = packages.filter(o => !!o.importer)
    .map(o => require(path.join(process.cwd(), 'diamond/packages', o.path, o.importer)));

  lockfile.unlockSync('./diamond/.internal/packages.lock');

  sass.render({
    file,
    outputStyle: options.outputStyle || 'nested',
    importer: [importer].concat(importers),
    functions,
  }, (error, result) => {
    if (error) {
      log.error('sass', error.message);
      log.error('not ok');
      process.exit(1);
    }

    resolve(result.css.toString());
  });
});
