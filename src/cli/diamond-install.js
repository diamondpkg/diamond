'use strict';

const fs = require('fs-extra');
const log = require('npmlog');
const path = require('path');
const async = require('async');
const lockfile = require('proper-lockfile');
const archy = require('archy');
const install = require('../functions/install');
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
};

exports.handler = (args) => {
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
    if (source) {
      packages.push({
        name: source.name,
        version: source.version,
        path: null,
        for: null,
        source,
      });
    } else {
      log.error('invalid package', pkg);
      log.error('not ok');
      process.exit(1);
    }
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

  async.eachLimit(packages, 1, (pkg, done) => {
    log.pause();
    log.gauge.enable();
    install(pkg, args).then((data) => {
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
  }, () => {
    const release = lockfile.lockSync('./diamond/.internal/packages.lock');
    let autoload = '';
    const installed = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
    for (const installedPkg of installed) {
      if (!installedPkg.for && fs.existsSync(path.join(process.cwd(), 'diamond/packages', installedPkg.path, 'diamond/dist/main.css'))) {
        autoload += `${fs.readFileSync(path.join(process.cwd(), 'diamond/packages', installedPkg.path, 'diamond/dist/main.css'))}\n\n`;
      } else if (!installedPkg.for && installedPkg.main.endsWith('.css')) {
        autoload += `${fs.readFileSync(path.join(process.cwd(), 'diamond/packages', installedPkg.path, installedPkg.main))}\n\n`;
      }
    }

    fs.writeFileSync('./diamond/autoload.css', autoload.trim());

    release();
    if (args.save) fs.writeFileSync('./diamond.json', JSON.stringify(packageJson, null, 2));

    process.stderr.write(`${archy(tree)}\n`);
    log.resume();
    process.exit(0);
  });
};
