'use strict';

const npm = require('./npm');
const github = require('./github');
const fs = require('fs-extra');
const klaw = require('klaw-sync');
const path = require('path');
const childProcess = require('child_process');
const log = require('npmlog');
const lockfile = require('proper-lockfile');
const chalk = require('chalk');
const async = require('async');
const compile = require('../compile');
const parsePackageObject = require('../parsePackageObject');

module.exports = pkg => new Promise((resolve) => {
  let packages;
  const node = { nodes: [] };

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
    const newPkg = data[2];

    fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));

    const dependencies = [];
    for (const source of parsePackageObject(pkg.dependencies)) {
      dependencies.push({
        name: source.name,
        version: source.version,
        path: null,
        for: pkg.path,
        source,
      });
    }

    async.each(dependencies, (dep, cb) => {
      module.exports(dep).then((n) => {
        node.nodes.push(n);
        cb();
      });
    }, () => {
      if (pkg.postCompile || pkg.functions || pkg.importer) {
        try {
          childProcess.execSync('npm i', { cwd: path.join('./diamond/packages', pkg.path), stdio: 'ignore' });
        } catch (err) {
          log.disableProgress();
          log.resume();
          lockfile.unlockSync('./diamond/.internal/packages.lock');
          log.error('npm', err.message);
          log.error('not ok');
          process.exit(1);
        }
      }

      fs.ensureDirSync(path.join('./diamond/packages', pkg.path, 'diamond/dist'));

      log.setGaugeTemplate([
        { type: 'activityIndicator', kerning: 1, length: 1 },
        { type: 'section', default: '' },
        ':',
        { type: 'logline', kerning: 1, default: '' },
      ]);

      const pulse = () => log.gauge.pulse();
      new Promise((rsolve) => {
        if (/\.sass|\.scss|\.less/.test(pkg.main)) {
          log.enableProgress();
          setInterval(pulse, 100);
          log.gauge.show({ section: 'compiling', logline: pkg.main }, 0);
          compile(path.join(process.cwd(), 'diamond/packages', pkg.path, pkg.main), { outputStyle: 'compressed' })
            .then((css) => {
              fs.writeFileSync(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.css'), css);
              log.gauge.show({ section: 'compiling', logline: pkg.main }, 1);
              rsolve();
            });
        } else rsolve();
      }).then(() => {
        clearInterval(pulse);
        log.disableProgress();
        log.setGaugeTemplate([
          { type: 'progressbar', length: 20 },
          { type: 'activityIndicator', kerning: 1, length: 1 },
          { type: 'section', default: '' },
          ':',
          { type: 'logline', kerning: 1, default: '' },
        ]);

        for (const p of klaw(path.join('./diamond/packages', pkg.path), { ignore: 'diamond/packages' })) {
          if (!/\.sass|\.scss$/.test(p.path)) continue;
          fs.writeFileSync(p.path, fs.readFileSync(p.path).toString().replace(/(\.)(-?[_a-zA-Z]+[\w-]*\s*[^;"'\d]?\n)|(@extend\s+)(\.)(-?[_a-zA-Z]+[\w-]*)/g, (match, p1, p2, p3, p4, p5) => {
            if (p1) {
              return `.#{$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__}${p2}`;
            }

            return `${p3}.#{$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__}${p5}`;
          }));
        }

        if (pkg.name && pkg.version) {
          node.label = `${pkg.name}@${pkg.version}`;
        } else {
          node.label = `${pkg.name}`;
        }

        node.label = newPkg ? chalk.green(node.label) : chalk.yellow(node.label);

        fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));
        resolve(node);
      });
    });
  });
});
