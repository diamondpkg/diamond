'use strict';

const util = require('util');
const sass = require('node-sass');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const lockfile = require('proper-lockfile');
const importer = require('../../importers/sass');
const raven = require('../error');

global.compileCommand = true;

module.exports = (file, options) => new Promise((resolve) => {
  let packages;
  try {
    packages = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
  } catch (err) {
    packages = [];
  }

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync('./package.json'));
  } catch (err) {
    packageJson = {};
    log.info('no package.json found');
  }

  function getValue(obj) {
    if (obj instanceof sass.types.String || obj instanceof sass.types.Boolean) {
      return obj.getValue();
    } else if (obj instanceof sass.types.Null) {
      return 'null';
    } else if (obj instanceof sass.types.Number) {
      return `${obj.getValue()}${obj.getUnit()}`;
    } else if (obj instanceof sass.types.Color) {
      return `rgba(${obj.getR()}, ${obj.getG()}, ${obj.getB()}, ${obj.getA()})`;
    } else if (obj instanceof sass.types.List) {
      const arr = [];
      for (let i = 0; i < obj.getLength(); i += 1) {
        arr.push(getValue(obj.getValue(i)));
      }

      return `[ ${arr.join(', ')} ]`;
    } else if (obj instanceof sass.types.Map) {
      const map = {};
      for (let i = 0; i < obj.getLength(); i += 1) {
        map[getValue(obj.getKey(i))] = getValue(obj.getValue(i));
      }

      return util.inspect(map);
    }

    return 'Unknown type';
  }

  const functions = {
    'log($obj)': (obj) => {
      process.stderr.write(`${getValue(obj)}\n`);

      return sass.types.Null.NULL;
    },
  };

  if (packageJson.diamond && packageJson.diamond.sass && packageJson.diamond.sass.functions) {
    if (typeof packageJson.diamond.sass.functions === 'string') {
      Object.assign(functions,
        require(path.join(process.cwd(), packageJson.diamond.sass.functions)));
    } else {
      for (const func in packageJson.diamond.sass.functions) {
        functions[func] = require(path.join(process.cwd(),
          packageJson.diamond.sass.functions[func]));
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
      packageJson.diamond && packageJson.diamond.postProcessor ?
        [require(path.join(process.cwd(), packageJson.diamond.postProcessor))] :
        []
    );

  const importers = packages.filter(o => !!o.importer).map(o => require(path.join(process.cwd(), 'diamond/packages', o.path, o.importer)))
    .concat(
      packageJson.diamond && packageJson.diamond.sass && packageJson.diamond.sass.importer ?
        [require(path.join(process.cwd(), packageJson.diamond.sass.importer))] :
        []
    );

  if (fs.existsSync('./diamond/.internal/packages.lock')) lockfile.unlockSync('./diamond/.internal/packages.lock');

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

    async.each(postProcessors, (postProcessor, done) => {
      let res;
      try {
        res = postProcessor(css);
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
