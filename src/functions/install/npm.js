'use strict';

const superagent = require('superagent');
const semver = require('semver');
const fs = require('fs-extra');
const log = require('npmlog');
const tar = require('tar-stream');
const zlib = require('zlib');
const path = require('path');

log.heading = 'dia';

module.exports = (packages, pkg) => new Promise((resolve) => {
  superagent.get(`https://registry.npmjs.org/${pkg.name}`)
    .then((res) => {
      let version;
      if (pkg.source.tag && res.body['dist-tags'][pkg.source.tag] && res.body.versions[res.body['dist-tags'][pkg.source.tag]]) {
        version = res.body.versions[res.body['dist-tags'][pkg.source.tag]];
      } else if (pkg.source.tag) {
        log.error(`invalid tag ${pkg.source.tag}`, pkg.name);
        log.error('not ok');
        process.exit(1);
      } else {
        const versions = Object.keys(res.body.versions)
          .filter(v => semver.satisfies(v, pkg.version))
          .sort(semver.compare)
          .reverse();
        if (versions.length) {
          version = res.body.versions[versions[0]];
        } else {
          log.error(`no versions match ${pkg.version}`, pkg.name);
          log.error('not ok');
          process.exit(1);
        }
      }

      pkg.version = version.version;
      pkg.main = version.diamond ?
        version.diamond.main :
        version.sass || version.less || version.style || version.main;
      pkg.postCompile = version.diamond ? version.diamond.postCompile : null;
      pkg.functions = version.diamond ? version.diamond.functions : null;
      pkg.importer = version.diamond ? version.diamond.importer : null;

      const old = packages.find(p => p.path === pkg.name);
      if (old && old.for && !old.version === pkg.version) {
        fs.ensureDirSync(`./diamond/packages/${old.for}/diamond/packages`);
        fs.renameSync(`./diamond/packages/${old.name}`, `./diamond/packages/${old.for}/diamond/packages/${old.name}`);
        old.path = `${old.for}/diamond/packages/${old.name}`;
        packages[packages.indexOf(old)] = old;
      } else if (old) {
        packages.splice(packages.indexOf(old), 1);
      }

      if (pkg.for && packages.find(p => p.name === pkg.name)) {
        fs.ensureDirSync(`./diamond/packages/${pkg.for}/diamond/packages`);
        fs.removeSync(`./diamond/packages/${pkg.for}/diamond/packages/${pkg.name}`);
        packages.splice(packages.findIndex(p => p.name === pkg.name), 1);
        pkg.path = `${pkg.for}/diamond/packages/${pkg.name}`;
      } else {
        fs.removeSync(`./diamond/packages/${pkg.name}`);
        if (packages.find(p => p.name === pkg.name)) {
          packages.splice(packages.findIndex(p => p.name === pkg.name), 1);
        }
        pkg.path = pkg.name;
      }

      const newPkg = !packages.find(p => p.name === pkg.name);
      packages.push(pkg);

      const req = superagent.get(version.dist.tarball);
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

        if (header.type === 'file' && /^package\//.test(header.name)) {
          const location = path.join('./diamond/packages', pkg.path, header.name.replace(/^package\//, ''));
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
    })
    .catch((res) => {
      log.error(`registry error: ${res.status}`, pkg.name);
      log.error('not ok');
      process.exit(1);
    });
});
