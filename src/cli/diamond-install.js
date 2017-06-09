'use strict';

const fs = require('fs-extra');
const log = require('npmlog');
const co = require('co');
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
    default: true,
  },
  cache: {
    boolean: true,
    desc: 'Don\'t pull packages from the package cache',
    default: true,
  },
  offline: {
    boolean: true,
    desc: 'Force offline mode',
    default: false,
  },
};

exports.handler = co.wrap(function* fn(args) {
  global.offline = args.offline;

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
  for (const pkg of args.pkgs) {
    const source = parsePackageString(pkg);
    packages.push({
      name: source.name,
      version: source.version,
      path: null,
      for: null,
      source,
    });
  }

  if (!packages.length) {
    for (const source of parsePackageObject(packageJson.dependencies)) {
      packages.push({
        name: source.name,
        version: source.version,
        path: null,
        for: null,
        source,
      });
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
    nodes: [],
  };

  for (let pkg of packages) {
    log.pause();
    log.gauge.enable();

    const data = yield install(pkg, args);
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
  }

  autoload();

  if (args.save) fs.writeFileSync('./diamond.json', JSON.stringify(packageJson, null, 2));

  process.stderr.write(`${archy(tree)}\n`);
  log.resume();
  process.exit(0);
});
