'use strict';

const fs = require('fs-extra');
const log = require('npmlog');
const path = require('path');
const async = require('async');
const program = require('commander');
const lockfile = require('proper-lockfile');
const install = require('../functions/install');
const parsePackageString = require('../functions/parsePackageString');

program.parse(process.argv);

const pkgs = program.args;

log.heading = 'dia';
log.info('it worked if it ends with', 'ok');

// For later
/*
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync('./package.json'));
} catch (err) {
  packageJson = {};
  log.info('no package.json found');
}

packageJson = Object.assign({ diamond: { dependencies: {} } }, packageJson);
*/

const packages = [];
for (const pkg of pkgs) {
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
  }
}

if (!packages.length) {
  log.info('no packages to install');
  log.info('ok');
  process.exit(0);
}

fs.ensureDirSync('./diamond/packages');
fs.ensureFileSync('./diamond/.internal/packages.lock');

fs.copySync(path.join(__dirname, '../importer.js'), './diamond/index.js');

const release = lockfile.lockSync('./diamond/.internal/packages.lock');

async.each(packages, (pkg, done) => {
  install(pkg).then(done);
}, () => {
  release();
  log.info('ok');
  process.exit(0);
});
