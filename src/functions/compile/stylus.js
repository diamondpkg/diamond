/* global cli:false */

'use strict';

const stylus = require('stylus');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const plugin = require('../../importers');

global.compileCommand = true;

module.exports = function* fn(data, filename) {
  let packages;
  try {
    packages = JSON.parse(yield fs.readFile('./diamond/.internal/packages.lock'));
  } catch (err) {
    packages = [];
  }

  let packageJson;
  try {
    packageJson = JSON.parse(yield fs.readFile('./diamond.json'));
  } catch (err) {
    packageJson = {};
    if (cli) log.info('no diamond.json found');
  }

  const plugins = [plugin.stylus];

  if (packageJson && packageJson.unify) {
    plugins.push(require(path.join(process.cwd(), packageJson.unify)).stylus);
  }

  const postProcessors = packages.filter(o => !!o.postProcessor).map(o => require(path.join(process.cwd(), 'diamond/packages', o.path, o.postProcessor)))
  .concat(
    packageJson.postProcessor ?
      [require(path.join(process.cwd(), packageJson.postProcessor))] :
      []
  );

  const style = stylus(data)
    .set('filename', filename);

  for (const plug of plugins) {
    style.use(plug);
  }

  let css;
  try {
    css = style.render();
  } catch (error) {
    if (cli) {
      log.disableProgress();
      log.resume();
      log.error('styl', error.message);
      log.error('styl', error.stack);
      log.error('not ok');
      process.exit(1);
    } else throw error;
  }

  for (const postProcessor of postProcessors) {
    try {
      css = yield postProcessor(css);
    } catch (err) {
      if (cli && typeof err === 'string') {
        log.disableProgress();
        log.resume();
        log.error('post install', err);
        log.error('not ok');
        process.exit(1);
      } else if (cli) {
        log.disableProgress();
        log.resume();
        log.error('post install', err.message);
        log.error('not ok');
        process.exit(1);
      } else throw err;
    }
  }

  return css;
};
