/* global cli:false */

'use strict';

const less = require('less');
const path = require('path');
const log = require('npmlog');
const fs = require('fs-extra');
const plugin = require('../../importers');
const CleanCSS = require('clean-css');
const postcss = require('postcss');

module.exports = function* fn(data, filename, options) {
  let packageJson;
  try {
    packageJson = JSON.parse(yield fs.readFile('./diamond.json'));
  } catch (err) {
    packageJson = {};
    if (cli) log.info('no diamond.json found');
  }

  const plugins = [plugin.less];

  if (packageJson && packageJson.unify) {
    plugins.push(require(path.join(process.cwd(), packageJson.unify)).less);
  }

  let result;
  try {
    result = yield less.render(data, { filename, plugins });
  } catch (error) {
    if (cli) {
      log.disableProgress();
      log.resume();
      log.error('less', error.stack);
      log.error('not ok');
      process.exit(1);
    } else throw error;
  }

  let css = result.css.toString();

  if (options.postcss) css = (yield postcss(options.postcss).process(css)).css;
  if (options.minify) css = (yield new CleanCSS({ compatibility: 'ie7', returnPromise: true }).minify(css)).styles;

  return css;
};
