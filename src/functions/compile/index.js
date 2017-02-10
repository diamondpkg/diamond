'use strict';

const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const compileSass = require('./sass');
const compileLess = require('./less');

module.exports = (file, options) => new Promise((resolve) => {
  fs.ensureDirSync('./diamond/packages');
  fs.ensureFileSync('./diamond/.internal/packages.lock');

  let packages;
  try {
    packages = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
  } catch (err) {
    packages = [];
  }

  const postCompiles = packages.filter(o => !!o.postCompile)
    .map(o => require(path.join(process.cwd(), 'diamond/packages', o.path, o.postCompile)));

  let promise;
  if (/\.sass|\.scss/.test(file)) {
    promise = compileSass(file, options);
  } else if (/\.less/.test(file)) {
    promise = compileLess(file);
  }

  promise.then((css) => {
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
