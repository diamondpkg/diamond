'use strict';

const path = require('path');
const fs = require('fs-extra');
const lockfile = require('proper-lockfile');

module.exports = (file, current) => {
  if (!/^\[([^\s/]+)(.+)?]$/.test(file)) return null;

  fs.ensureDirSync('./diamond/.staging');
  fs.ensureDirSync('./diamond/packages');
  fs.ensureFileSync('./diamond/.internal/packages.lock');

  const release = lockfile.lockSync('./diamond/.internal/packages.lock');

  let packages;

  try {
    packages = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
  } catch (err) {
    packages = [];
  }

  if (!packages.length) {
    release();
    return new Error('no packages installed');
  }

  const match = file.match(/^\[([^\s/]+)(.+)?]$/);

  let pkg;
  if (/^packages\/([^/]+).+/.test(path.relative(__dirname, current))) {
    pkg = packages.find((p) => {
      const currentPkg = path.relative(__dirname, current).match(/^packages\/([^/]+).+/)[1];
      return p.path === `${currentPkg}/diamond-packages/${match[1].toLowerCase()}`;
    }) || packages.find(p => p.path === match[1].toLowerCase());
  } else {
    pkg = packages.find(p => p.path === match[1].toLowerCase());
  }

  if (!pkg) {
    release();
    return new Error(`could not find package '${match[1].toLowerCase()}'`);
  }

  if (match[2]) {
    release();
    try {
      fs.accessSync(path.join(process.cwd(), 'diamond/packages', pkg.name, match[2]));
    } catch (err) {
      return new Error(`could not find file '${path.join(match[1].toLowerCase(), match[2].toLowerCase())}'`);
    }
    return { file: path.join(process.cwd(), 'diamond/packages', pkg.name, match[2]) };
  } else if (pkg.main) {
    release();
    try {
      fs.accessSync(path.join(process.cwd(), 'diamond/packages', pkg.name, pkg.main));
    } catch (err) {
      return new Error(`could not find file '${path.join(match[1].toLowerCase(), pkg.main)}' this is likely a problem with the package itself`);
    }
    return { file: path.join(process.cwd(), 'diamond/packages', pkg.name, pkg.main) };
  }

  release();
  return new Error('the package has no mainfile! you need to import files from this package manually');
};
