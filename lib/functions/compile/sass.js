/* global cli:false */

'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const sass = require('node-sass');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const bleubird = require('bluebird');
const plugin = require('../../importers');

global.compileCommand = true;

module.exports = (() => {
  var _ref = _asyncToGenerator(function* (file, options) {
    if (!options) options = {};
    Object.assign(options, { outputStyle: 'nested' });

    let packages;
    try {
      packages = JSON.parse((yield fs.readFile('./diamond/.internal/packages.lock')));
    } catch (err) {
      packages = [];
    }

    let packageJson;
    try {
      packageJson = JSON.parse((yield fs.readFile('./diamond.json')));
    } catch (err) {
      packageJson = {};
      if (cli) log.info('no diamond.json found');
    }

    const functions = {};
    if (packageJson.sass && packageJson.sass.functions) {
      if (typeof packageJson.sass.functions === 'string') {
        Object.assign(functions, require(path.join(process.cwd(), packageJson.sass.functions)));
      } else {
        for (const func in packageJson.sass.functions) {
          functions[func] = require(path.join(process.cwd(), packageJson.sass.functions[func]));
        }
      }
    }

    packages.filter(function (o) {
      return !!o.functions;
    }).forEach(function (o) {
      if (typeof o.functions === 'string') {
        Object.assign(functions, require(path.join(process.cwd(), 'diamond/packages', o.path, o.functions)));
      } else {
        for (const func in o.functions) {
          functions[func] = require(path.join(process.cwd(), 'diamond/packages', o.path, o.functions[func]));
        }
      }
    });

    const postProcessors = packages.filter(function (o) {
      return !!o.postProcessor;
    }).map(function (o) {
      return require(path.join(process.cwd(), 'diamond/packages', o.path, o.postProcessor));
    }).concat(packageJson.postProcessor ? [require(path.join(process.cwd(), packageJson.postProcessor))] : []);

    let importers = packages.filter(function (o) {
      return !!o.importer;
    }).map(function (o) {
      return require(path.join(process.cwd(), 'diamond/packages', o.path, o.importer));
    }).concat(packageJson && packageJson.importer ? [require(path.join(process.cwd(), packageJson.importer))] : []);

    if (packageJson && packageJson.unify) {
      const plug = require(path.join(process.cwd(), packageJson.unify)).sass;
      importers = importers.concat(plug.importers);
      Object.assign(functions, plug.functions);
    }

    let result;
    try {
      result = yield bleubird.promisify(sass.render)({
        file,
        outputStyle: options.outputStyle,
        importer: importers.concat(plugin.sass.importers),
        functions
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

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = postProcessors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        const postProcessor = _step.value;

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
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return css;
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();