'use strict';

const sass = require('node-sass');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const async = require('async');
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
  const postCompiles = packages.filter(o => !!o.postCompile)
    .map(o => require(path.join(process.cwd(), 'diamond/packages', o.path, o.postCompile)));

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
      log.disableProgress();
      log.resume();
      log.error('sass', error.message);
      log.error('not ok');
      process.exit(1);
    }

    let css = result.css.toString();

    async.each(postCompiles, (postCompile, done) => {
      let res;
      try {
        res = postCompile(css);
      } catch (err) {
        if (typeof err === 'string') {
          log.disableProgress();
          log.resume();
          log.error('post install', err);
          log.error('not ok');
          process.exit(1);
        } else {
          log.disableProgress();
          log.resume();
          log.error('post install', err.message);
          log.error('not ok');
          process.exit(1);
        }
      }

      Promise.resolve(res).then((newCss) => {
        css = newCss;
        done();
      }).catch((err) => {
        if (typeof err === 'string') {
          log.disableProgress();
          log.resume();
          log.error('post install', err);
          log.error('not ok');
          process.exit(1);
        } else {
          log.disableProgress();
          log.resume();
          log.error('post install', err.message);
          log.error('not ok');
          process.exit(1);
        }
      });
    }, () => {
      resolve(css);
    });
  });
});
