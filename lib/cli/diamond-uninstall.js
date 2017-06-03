'use strict';

const fs = require('fs-extra');
const log = require('npmlog');
const path = require('path');
const lockfile = require('proper-lockfile');
const autoload = require('../functions/autoload');

log.heading = 'dia';

exports.command = 'uninstall [pkgs..]';
exports.desc = 'Uninstall one or more packages';
exports.aliases = ['u'];
exports.builder = {};

exports.handler = args => {
  fs.ensureDirSync('./diamond/packages');
  fs.ensureFileSync('./diamond/.internal/packages.lock');

  const release = lockfile.lockSync('./diamond/.internal/packages.lock');

  let packages;
  try {
    packages = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
  } catch (err) {
    process.exit(0);
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = args.pkgs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      const name = _step.value;

      let index = 0;
      const pkg = packages.find((p, i) => {
        index = i;
        return p.name.toLowerCase() === name.toLowerCase() && !p.for;
      });
      if (!pkg) continue;
      fs.removeSync(path.join(process.cwd(), 'diamond', 'packages', pkg.path));
      packages.splice(index, 1);

      for (const i in packages) {
        const dep = packages[i];
        if (dep.for && dep.for.toLowerCase() !== name.toLowerCase()) continue;
        fs.removeSync(path.join(process.cwd(), 'diamond', 'packages', dep.path));
        packages.splice(i, 1);
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

  fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));

  release();

  autoload();
};