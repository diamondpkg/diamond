'use strict';

const less = require('less');
const path = require('path');
const log = require('npmlog');
const fs = require('fs-extra');
const plugin = require('less-plugin-diamond');

module.exports = filename => new Promise((resolve) => {
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync('./diamond.json'));
  } catch (err) {
    packageJson = {};
    log.info('no diamond.json found');
  }

  const plugins = [plugin];

  if (packageJson && packageJson.unify) {
    plugins.push(require(path.join(process.cwd(), packageJson.unify)).toLess());
  }

  less.render(fs.readFileSync(filename).toString(), { filename, plugins })
    .then((result) => {
      resolve(result.css.toString());
    }).catch((error) => {
      log.disableProgress();
      log.resume();
      log.error('less', error.message);
      log.error('not ok');
      process.exit(1);
    });
});
