/* global cli:false */

'use strict';

const less = require('less');
const path = require('path');
const log = require('npmlog');
const fs = require('fs-extra');
const plugin = require('../../importers');

module.exports = filename => new Promise((resolve, reject) => {
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync('./diamond.json'));
  } catch (err) {
    packageJson = {};
    if (cli) log.info('no diamond.json found');
  }

  const plugins = [plugin.less];

  if (packageJson && packageJson.unify) {
    plugins.push(require(path.join(process.cwd(), packageJson.unify)).less);
  }

  less.render(fs.readFileSync(filename).toString(), { filename, plugins })
    .then((result) => {
      resolve(result.css.toString());
    }).catch((error) => {
      if (cli) {
        log.disableProgress();
        log.resume();
        log.error('less', error.message);
        log.error('less', error.stack);
        log.error('not ok');
        process.exit(1);
      } else reject(error);
    });
});
