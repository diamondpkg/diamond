'use strict';

const npm = require('./npm');
const github = require('./github');
const fs = require('fs-extra');
const klaw = require('klaw-sync');
const path = require('path');
const childProcess = require('child_process');
const log = require('npmlog');
const lockfile = require('proper-lockfile');

module.exports = pkg1 => new Promise((resolve) => {
  let packages;
  let pkg = pkg1;

  try {
    packages = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
  } catch (err) {
    packages = [];
  }

  let promise;
  if (pkg.source.type === 'npm') {
    promise = npm(packages, pkg);
  } else if (pkg.source.type === 'github') {
    promise = github(packages, pkg);
  }

  promise.then((data) => {
    packages = data[0];
    pkg = data[1];

    if (pkg.postCompile || pkg.functions || pkg.importer) {
      log.info('installing npm dependencies', 'this may take a little while');
      try {
        childProcess.execSync('npm i', { cwd: path.join('./diamond/packages', pkg.path) });
      } catch (err) {
        lockfile.unlockSync('./diamond/.internal/packages.lock');
        log.error('npm', err.message);
        log.error('not ok');
        process.exit(1);
      }
    }

    for (const p of klaw(path.join('./diamond/packages', pkg.path), { ignore: 'diamond-packages' })) {
      if (!/\.sass|\.scss$/.test(p.path)) continue;
      fs.writeFileSync(p.path, fs.readFileSync(p.path).toString().replace(/(\.)(-?[_a-zA-Z]+[\w-]*\s*[^;"'\d]?\n)|(@extend\s+)(\.)(-?[_a-zA-Z]+[\w-]*)/g, (match, p1, p2, p3, p4, p5) => {
        if (p1) {
          return `.#{$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__}${p2}`;
        }

        return `${p3}.#{$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__}${p5}`;
      }));
    }

    fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));
    resolve();
  });
});