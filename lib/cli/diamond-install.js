'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const fs = require('fs-extra');
const log = require('npmlog');
const async = require('async');
const archy = require('archy');
const install = require('../functions/install');
const autoload = require('../functions/autoload');
const parsePackageString = require('../functions/parsePackageString');
const parsePackageObject = require('../functions/parsePackageObject');

log.heading = 'dia';

exports.command = 'install [pkgs...]';
exports.desc = 'install one or more packages';
exports.aliases = ['i'];
exports.builder = {
  save: {
    boolean: true,
    desc: 'Don\'t save packages in your diamond.json',
    default: true
  },
  cache: {
    boolean: true,
    desc: 'Don\'t pull packages from the package cache',
    default: true
  }
};

exports.handler = args => {
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync('./diamond.json'));
  } catch (err) {
    packageJson = {};
    log.info('no diamond.json found');
  }

  packageJson = Object.assign({ dependencies: {} }, packageJson);

  log.enableProgress();

  const packages = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = args.pkgs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      const pkg = _step.value;

      const source = parsePackageString(pkg);
      if (source) {
        packages.push({
          name: source.name,
          version: source.version,
          path: null,
          for: null,
          source
        });
      } else {
        log.error('invalid package', pkg);
        log.error('not ok');
        process.exit(1);
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

  if (!packages.length) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = parsePackageObject(packageJson.dependencies)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        const source = _step2.value;

        packages.push({
          name: source.name,
          version: source.version,
          path: null,
          for: null,
          source
        });
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
  }

  if (!packages.length) {
    log.info('no packages to install');
    process.exit(0);
  }

  fs.ensureDirSync('./diamond/packages');
  fs.ensureFileSync('./diamond/.internal/packages.lock');

  let label;
  if (packageJson.name && packageJson.version) {
    label = `${packageJson.name}@${packageJson.version} ${process.cwd()}`;
  } else if (packageJson.name) {
    label = `${packageJson.name} ${process.cwd()}`;
  } else {
    label = process.cwd();
  }

  const tree = {
    label,
    nodes: []
  };

  async.eachLimit(packages, 1, (pkg, done) => {
    log.pause();
    log.gauge.enable();
    install(pkg, args).then(data => {
      tree.nodes.push(data[0]);

      pkg = data[1];
      if (args.save) {
        if (pkg.source.type === 'diamond') {
          packageJson.dependencies[pkg.name] = `^${pkg.version}`;
        } else if (pkg.source.type === 'npm') {
          packageJson.dependencies[pkg.name] = `npm:${pkg.name}@^${pkg.version}`;
        } else {
          packageJson.dependencies[pkg.name] = `${pkg.source.type}:${pkg.source.owner}/${pkg.source.repo}${pkg.source.ref ? `#${pkg.source.ref}` : ''}`;
        }
      }

      done();
    });
  }, _asyncToGenerator(function* () {
    yield autoload();

    if (args.save) fs.writeFileSync('./diamond.json', JSON.stringify(packageJson, null, 2));

    process.stderr.write(`${archy(tree)}\n`);
    log.resume();
    process.exit(0);
  }));
};