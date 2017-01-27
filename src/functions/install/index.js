'use strict';

const npm = require('./npm');
const github = require('./github');
const fs = require('fs-extra');

module.exports = pkg => new Promise((resolve) => {
  let packages;

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
    fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));
    resolve();
  });
});
