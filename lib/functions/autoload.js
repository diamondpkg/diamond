'use strict';

const fs = require('fs-extra');
const path = require('path');
const lockfile = require('proper-lockfile');

module.exports = () => {
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

  fs.writeFileSync('./diamond/autoload.css', autoload.trim());

  release();
};