'use strict';

const npm = require('./npm');
const github = require('./github');
const fs = require('fs-extra');
const klaw = require('klaw-sync');
const path = require('path');

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

    for (const p of klaw(path.join('./diamond/packages', pkg.path), { ignore: 'diamond-packages' })) {
      if (!/\.scss$/.test(p.path)) continue;
      fs.writeFileSync(p.path, fs.readFileSync(p.path).toString().replace(/(\.)(-?[_a-zA-Z]+[\w-]*\s*[^;"'\d]?\n)|(@extend\s+)(\.)(-?[_a-zA-Z]+[\w-]*)/g, (match, p1, p2, p3, p4, p5) => {
        if (p1) {
          return `.#{$__${pkg.name}__namespace__}${p2}`;
        }

        return `${p3}.#{$__${pkg.name}__namespace__}${p5}`;
      }));
    }

    fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));
    resolve();
  });
});
