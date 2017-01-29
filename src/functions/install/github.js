'use strict';

const superagent = require('superagent');
const fs = require('fs-extra');
const log = require('npmlog');
const tar = require('tar-stream');
const zlib = require('zlib');
const path = require('path');

log.heading = 'dia';

function download(resolve, pkgs, pkg1) {
  const pkg = pkg1;
  const packages = pkgs;

  const old = packages.find(p => p.path === pkg.name);
  if (old && old.for && !old.version === pkg.version) {
    fs.ensureDirSync(`./diamond/packages/${old.for}/diamond-packages`);
    fs.renameSync(`./diamond/packages/${old.name}`, `./diamond/packages/${old.for}/diamond-packages/${old.name}`);
    old.path = `${old.for}/diamond-packages/${old.name}`;
    packages[packages.indexOf(old)] = old;
  } else if (old) {
    packages.splice(packages.indexOf(old), 1);
  }

  if (pkg.for && packages.find(p => p.name === pkg.name)) {
    fs.ensureDirSync(`./diamond/packages/${pkg.for}/diamond-packages`);
    fs.removeSync(`./diamond/packages/${pkg.for}/diamond-packages/${pkg.name}`);
    packages.splice(packages.findIndex(p => p.name === pkg.name), 1);
    pkg.path = `${pkg.for}/diamond-packages/${pkg.name}`;
  } else {
    fs.removeSync(`./diamond/packages/${pkg.name}`);
    if (packages.find(p => p.name === pkg.name)) {
      packages.splice(packages.findIndex(p => p.name === pkg.name), 1);
    }
    pkg.path = pkg.name;
  }

  packages.push(pkg);

  const req = superagent.get(`https://github.com/${pkg.source.owner}/${pkg.source.repo}/archive/${pkg.source.ref}.tar.gz`);
  const extract = tar.extract();

  req.on('response', (r) => {
    if (r.status !== 200) {
      log.error(`error downloading: ${r.status}`, pkg.name);
      log.error('not ok');
      process.exit(1);
    }
  });

  extract.on('entry', (header, stream, next) => {
    let write;

    if (header.type === 'file' && /^[^/]+\//i.test(header.name)) {
      const location = path.join('./diamond/packages', pkg.path, header.name.replace(/^[^/]+\//i, ''));
      fs.ensureFileSync(location);
      write = fs.createWriteStream(location);
      stream.pipe(write);
    }

    if (write) {
      write.on('finish', () => {
        next();
      });
    } else {
      stream.on('end', () => {
        next();
      });
    }

    stream.resume();
  });

  extract.on('finish', () => {
    resolve([packages, pkg]);
  });

  req
    .pipe(zlib.createGunzip())
    .pipe(extract);
}

module.exports = (pkgs, pkg1) => new Promise((resolve) => {
  const pkg = pkg1;
  const packages = pkgs;
  superagent.get(`https://raw.githubusercontent.com/${pkg.source.owner}/${pkg.source.repo}/${pkg.source.ref}/package.json`)
    .then((res) => {
      let info;
      try {
        info = JSON.parse(res.text);
      } catch (err) {
        info = {};
      }

      pkg.name = info.name || pkg.source.repo;
      pkg.version = info.version;
      pkg.main = info.diamond ? info.diamond.main : info.sass || info.style || info.main;

      download(resolve, packages, pkg);
    })
    .catch((res) => {
      if (res.status === 404) {
        log.warn('no package.json', `${pkg.source.owner}/${pkg.source.repo}#${pkg.source.ref}`);
        pkg.name = pkg.source.repo;
        download(resolve, packages, pkg);
      } else {
        log.error(`error downloading package.json: ${res.status}`, `${pkg.source.owner}/${pkg.source.repo}#${pkg.source.ref}`);
        log.error('not ok');
        process.exit(1);
      }
    });
});
