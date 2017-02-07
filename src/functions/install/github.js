'use strict';

const superagent = require('superagent');
const fs = require('fs-extra');
const log = require('npmlog');
const tar = require('tar-stream');
const zlib = require('zlib');
const path = require('path');

log.heading = 'dia';

function download(resolve, packages, pkg) {
  let index = 0;
  const newPkg = !packages.find(p => p.name === pkg.name);

  const old = packages.find((p, i) => {
    index = i;
    return p.path === pkg.name;
  });

  if (old && old.for && !old.version === pkg.version) {
    fs.ensureDirSync(`./diamond/packages/${old.for}/diamond/packages`);
    fs.renameSync(`./diamond/packages/${old.name}`, `./diamond/packages/${old.for}/diamond/packages/${old.name}`);
    old.path = `${old.for}/diamond/packages/${old.name}`;
    packages[index] = old;
  } else if (old) {
    packages.splice(index, 1);
  }

  index = 0;
  const found = packages.find((p, i) => {
    index = i;
    return p.name === pkg.name;
  });

  if (pkg.for && found) {
    fs.ensureDirSync(`./diamond/packages/${pkg.for}/diamond/packages`);
    fs.removeSync(`./diamond/packages/${pkg.for}/diamond/packages/${pkg.name}`);
    packages.splice(index, 1);
    pkg.path = `${pkg.for}/diamond/packages/${pkg.name}`;
  } else {
    fs.removeSync(`./diamond/packages/${pkg.name}`);
    if (found) {
      packages.splice(index, 1);
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

  log.enableProgress();

  extract.on('entry', (header, stream, next) => {
    let write;

    if (header.type === 'file' && /^[^/]+\//i.test(header.name)) {
      const location = path.join('./diamond/packages', pkg.path, header.name.replace(/^[^/]+\//i, ''));
      fs.ensureFileSync(location);
      write = fs.createWriteStream(location);
      stream.pipe(write);
      stream.on('data', (c) => {
        log.gauge.show(`extract: ${header.name.replace(/^package\//, '')}`, c.length / header.size);
      });
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
    log.disableProgress();
    resolve([packages, pkg, newPkg]);
  });

  req
    .pipe(zlib.createGunzip())
    .pipe(extract);
}

module.exports = (packages, pkg) => new Promise((resolve) => {
  superagent.get(`https://raw.githubusercontent.com/${pkg.source.owner}/${pkg.source.repo}/${pkg.source.ref}/package.json`)
    .then((res) => {
      let info;
      try {
        info = JSON.parse(res.text);
      } catch (err) {
        info = {};
      }

      pkg.name = pkg.name || info.name || pkg.source.repo;
      pkg.version = info.version;
      pkg.main = info.diamond ?
        info.diamond.main :
        info.sass || info.less || info.style || info.main;
      pkg.postCompile = info.diamond ? info.diamond.postCompile : null;
      pkg.functions = info.diamond ? info.diamond.functions : null;
      pkg.importer = info.diamond ? info.diamond.importer : null;
      pkg.dependencies = info.diamond ? info.diamond.dependencies : {};

      download(resolve, packages, pkg);
    })
    .catch((res) => {
      if (res.status === 404) {
        log.warn('no package.json', `${pkg.source.owner}/${pkg.source.repo}#${pkg.source.ref}`);
        pkg.name = pkg.name || pkg.source.repo;
        download(resolve, packages, pkg);
      } else {
        log.error(`error downloading package.json: ${res.status}`, `${pkg.source.owner}/${pkg.source.repo}#${pkg.source.ref}`);
        log.error('not ok');
        process.exit(1);
      }
    });
});
