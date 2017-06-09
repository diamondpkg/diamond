/* global cli:false */

'use strict';

const sass = require('node-sass');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const bleubird = require('bluebird');
const plugin = require('../../importers');
const CleanCSS = require('clean-css');

global.compileCommand = true;

module.exports = function* fn(data, filename, options) {
  if (!options) options = {};
  Object.assign(options, { outputStyle: 'nested' });

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
    result = yield bleubird.promisify(sass.render)(Object.assign(options, {
      data,
      file: filename,
      indentedSyntax: (filename ? filename.endsWith('.sass') : false) || options.indentedSyntax,
      importer: importers.concat(plugin.sass.importers),
      functions,
    }));
  } catch (error) {
    if (cli) {
      log.disableProgress();
      log.resume();
      log.error('sass', error.stack);
      log.error('not ok');
      process.exit(1);
    } else throw error;
  }

  let css = result.css.toString();

  for (const postProcessor of postProcessors) {
    try {
      css = yield postProcessor(css);
    } catch (err) {
      if (cli) {
        log.disableProgress();
        log.resume();
        log.error('post install', err.stack);
        log.error('not ok');
        process.exit(1);
      } else throw err;
    }
  }

  if (options.minify) css = (yield new CleanCSS({ compatibility: 'ie7', returnPromise: true }).minify(css)).styles;

  return css;
};
