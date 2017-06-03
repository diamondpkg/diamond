'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const fs = require('fs-extra');
const path = require('path');
const lockfile = require('proper-lockfile');

module.exports = _asyncToGenerator(function* () {
  const release = lockfile.lockSync('./diamond/.internal/packages.lock');
  let autoload = '';
  const installed = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = installed[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      const installedPkg = _step.value;

      if (!installedPkg.for && fs.existsSync(path.join(process.cwd(), 'diamond/packages', installedPkg.path, 'diamond/dist/main.css'))) {
        autoload += `${fs.readFileSync(path.join(process.cwd(), 'diamond/packages', installedPkg.path, 'diamond/dist/main.css'))}\n\n`;
      } else if (!installedPkg.for && installedPkg.main.endsWith('.css')) {
        autoload += `${fs.readFileSync(path.join(process.cwd(), 'diamond/packages', installedPkg.path, installedPkg.main))}\n\n`;
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

  yield fs.writeFile('./diamond/autoload.css', autoload.trim());

  release();
});