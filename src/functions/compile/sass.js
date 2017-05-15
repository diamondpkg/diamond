'use strict';

const util = require('util');
const sass = require('node-sass');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const plugin = require('../../importers');

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
    packageJson = JSON.parse(fs.readFileSync('./diamond.json'));
  } catch (err) {
    packageJson = {};
    log.info('no diamond.json found');
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

  sass.render({
    file,
    outputStyle: options.outputStyle || 'nested',
    importer: importers.concat(plugin.sass.importers),
    functions,
  }, (error, result) => {
    if (error) {
      log.disableProgress();
      log.resume();
      log.error('sass', error.message);
      log.error('sass', error.stack);
      log.error('not ok');
      process.exit(1);
    }

    let css = result.css.toString();

    async.eachLimit(postProcessors, 1, (postProcessor, done) => {
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
