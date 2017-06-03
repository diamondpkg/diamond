/* global cli:false */

'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const stylus = require('stylus');
const log = require('npmlog');
const fs = require('fs-extra');
const path = require('path');
const plugin = require('../../importers');

global.compileCommand = true;

module.exports = (() => {
  var _ref = _asyncToGenerator(function* (file) {
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

    const plugins = [plugin.stylus];

    if (packageJson && packageJson.unify) {
      plugins.push(require(path.join(process.cwd(), packageJson.unify)).stylus);
    }

    const postProcessors = packages.filter(function (o) {
      return !!o.postProcessor;
    }).map(function (o) {
      return require(path.join(process.cwd(), 'diamond/packages', o.path, o.postProcessor));
    }).concat(packageJson.postProcessor ? [require(path.join(process.cwd(), packageJson.postProcessor))] : []);

    const style = stylus((yield fs.readFile(file, 'utf8'))).set('filename', file);

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = plugins[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        const plug = _step.value;

        style.use(plug);
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

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = postProcessors[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        const postProcessor = _step2.value;

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
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return css;
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();