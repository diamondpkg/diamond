/* global cli:false */

'use strict';

const sass = require('node-sass');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const bleubird = require('bluebird');
const plugin = require('../../importers');

global.compileCommand = true;

module.exports = async (file, options) => {
  if (!options) options = {};
  Object.assign(options, { outputStyle: 'nested' });

  let packages;
  try {
    packages = JSON.parse(await fs.readFile('./diamond/.internal/packages.lock'));
  } catch (err) {
    packages = [];
  }

  let packageJson;
  try {
    packageJson = JSON.parse(await fs.readFile('./diamond.json'));
  } catch (err) {
    packageJson = {};
    if (cli) log.info('no diamond.json found');
  }

  const functions = {};
  if (packageJson.sass && packageJson.sass.functions) {
    if (typeof packageJson.sass.functions === 'string') {
      Object.assign(functions,
        require(path.join(process.cwd(), packageJson.sass.functions)));
    } else {
      for (const func in packageJson.sass.functions) {
        functions[func] = require(path.join(process.cwd(),
          packageJson.sass.functions[func]));
      }
    }
  }

  packages.filter(o => !!o.functions)
    .forEach((o) => {
      if (typeof o.functions === 'string') {
        Object.assign(functions, require(path.join(process.cwd(), 'diamond/packages', o.path, o.functions)));
      } else {
        for (const func in o.functions) {
          functions[func] = require(path.join(process.cwd(), 'diamond/packages', o.path, o.functions[func]));
        }
      }
    });

  const postProcessors = packages.filter(o => !!o.postProcessor).map(o => require(path.join(process.cwd(), 'diamond/packages', o.path, o.postProcessor)))
    .concat(
      packageJson.postProcessor ?
        [require(path.join(process.cwd(), packageJson.postProcessor))] :
        []
    );

  let importers = packages.filter(o => !!o.importer).map(o => require(path.join(process.cwd(), 'diamond/packages', o.path, o.importer)))
    .concat(
      packageJson && packageJson.importer ?
        [require(path.join(process.cwd(), packageJson.importer))] :
        []
    );

  if (packageJson && packageJson.unify) {
    const plug = require(path.join(process.cwd(), packageJson.unify)).sass;
    importers = importers.concat(plug.importers);
    Object.assign(functions, plug.functions);
  }

  let result;
  try {
    result = await bleubird.promisify(sass.render)({
      file,
      outputStyle: options.outputStyle,
      importer: importers.concat(plugin.sass.importers),
      functions,
    });
  } catch (error) {
    if (cli) {
      log.disableProgress();
      log.resume();
      log.error('sass', error.message);
      log.error('sass', error.stack);
      log.error('not ok');
      process.exit(1);
    } else throw error;
  }

  let css = result.css.toString();

  for (const postProcessor of postProcessors) {
    try {
      css = await postProcessor(css);
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
