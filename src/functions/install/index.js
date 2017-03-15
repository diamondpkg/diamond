'use strict';

const npm = require('./npm');
const github = require('./github');
const gitlab = require('./gitlab');
const os = require('os');
const fs = require('fs-extra');
const klaw = require('klaw-sync');
const stream = require('stream');
const path = require('path');
const childProcess = require('child_process');
const log = require('npmlog');
const lockfile = require('proper-lockfile');
const chalk = require('chalk');
const async = require('async');
const superagent = require('superagent');
const tar = require('tar');
const zlib = require('zlib');
const crypto = require('crypto');
const fstream = require('fstream');
const compile = require('../compile');
const parsePackageObject = require('../parsePackageObject');

module.exports = (pkg, options) => new Promise((resolve) => {
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
  } else if (pkg.source.type === 'gitlab') {
    promise = gitlab(packages, pkg);
  }

  promise.then((data) => {
    const info = data[0];
    const url = data[1];
    const shasum = data[2];

    if (info) {
      pkg.name = pkg.name || info.name || pkg.source.repo;
      pkg.version = info.version;
      pkg.main = info.diamond ?
        info.diamond.main :
        info.sass || info.less || info.style || info.main;
      pkg.postCompile = info.diamond ? info.diamond.postCompile : null;
      pkg.functions = info.diamond ? info.diamond.functions : null;
      pkg.importer = info.diamond ? info.diamond.importer : null;
      pkg.dependencies = info.diamond ? info.diamond.dependencies : {};
    } else {
      pkg.name = pkg.name || pkg.source.repo;
    }

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

    let verString = '';
    if (pkg.version) verString = `@${pkg.version}`;
    else if (pkg.ref) verString = `#${pkg.ref}`;

    if (options.cache && fs.existsSync(path.join(os.homedir(), '.diamond/package-cache', `${pkg.name}${verString}.tar.gz`))) {
      const extract = tar.Extract({ path: path.join('./diamond/packages') });

      log.setGaugeTemplate([
        { type: 'activityIndicator', kerning: 1, length: 1 },
        { type: 'section', default: '' },
        ':',
        { type: 'logline', kerning: 1, default: '' },
      ]);
      log.enableProgress();

      extract.on('entry', (entry) => {
        log.gauge.show({ section: 'extract', logline: entry.path });
        log.gauge.pulse();
      });

      extract.on('end', () => {
        log.disableProgress();
        log.setGaugeTemplate([
          { type: 'progressbar', length: 20 },
          { type: 'activityIndicator', kerning: 1, length: 1 },
          { type: 'section', default: '' },
          ':',
          { type: 'logline', kerning: 1, default: '' },
        ]);

        if (pkg.name && pkg.version) {
          node.label = `${pkg.name}@${pkg.version}`;
        } else if (pkg.name && pkg.ref) {
          node.label = `${pkg.name}#${pkg.ref}`;
        } else {
          node.label = `${pkg.name}`;
        }

        node.label = newPkg ? chalk.green(node.label) : chalk.yellow(node.label);
        node.label = `${node.label} ${chalk.cyan('(from cache)')}`;

        fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));
        resolve([node, pkg]);
      });

      fs.createReadStream(path.join(os.homedir(), '.diamond/package-cache', `${pkg.name}${verString}.tar.gz`))
        .pipe(zlib.createGunzip())
        .pipe(extract);
    } else {
      const req = superagent.get(url);
      const passthrough = new stream.PassThrough();
      const gzip = zlib.createGunzip();
      const extract = tar.Extract({
        path: path.join('./diamond/packages', pkg.path),
        strip: 1,
      });

      let contents = Buffer.alloc(0);

      req.on('response', (r) => {
        if (!r.ok) {
          log.disableProgress();
          log.resume();
          log.error(`error downloading: ${r.status}`, pkg.name);
          log.error('not ok');
          process.exit(1);
        } else if (!info) {
          log.warn('no package.json', `${pkg.source.owner}/${pkg.source.repo}#${pkg.source.ref}`);
        }
      });

      passthrough.on('data', (buf) => {
        contents = Buffer.concat([contents, buf]);
        gzip.write(buf);
      });

      passthrough.on('end', () => gzip.end());

      log.setGaugeTemplate([
        { type: 'activityIndicator', kerning: 1, length: 1 },
        { type: 'section', default: '' },
        ':',
        { type: 'logline', kerning: 1, default: '' },
      ]);
      log.enableProgress();

      extract.on('entry', (entry) => {
        log.gauge.show({ section: 'extract', logline: entry.path });
        log.gauge.pulse();
      });

      extract.on('end', () => {
        log.disableProgress();
        log.setGaugeTemplate([
          { type: 'progressbar', length: 20 },
          { type: 'activityIndicator', kerning: 1, length: 1 },
          { type: 'section', default: '' },
          ':',
          { type: 'logline', kerning: 1, default: '' },
        ]);

        if (shasum && shasum !== crypto.createHash('sha1').update(contents, 'utf8').digest('hex')) {
          log.disableProgress();
          log.resume();
          log.error('shasum does not match', pkg.name);
          log.error('not ok');
          process.exit(1);
        }

        fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));

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

          /* eslint-disable */
          /*
          for (const p of klaw(path.join('./diamond/packages', pkg.path), { ignore: 'diamond/packages' })) {
            if (!/\.sass|\.scss$/.test(p.path)) continue;
            fs.writeFileSync(p.path, fs.readFileSync(p.path).toString().replace(/(\.)(-?[_a-zA-Z]+[\w-]*\s*[^;"'\d]?\n)|(@extend\s+)(\.)(-?[_a-zA-Z]+[\w-]*)/g, (match, p1, p2, p3, p4, p5) => {
              if (p1) {
                return `.#{$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__}${p2}`;
              }

              return `${p3}.#{$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__}${p5}`;
            }));
          }
          */
          /* eslint-enable */

          fs.ensureDirSync(path.join(os.homedir(), '.diamond/package-cache'));

          const writeStream = fs.createWriteStream(path.join(os.homedir(), '.diamond/package-cache', `${pkg.name}${verString}.tar.gz`))
            .on('finish', () => {
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
                module.exports(dep, options).then((n) => {
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

                if (pkg.name && pkg.version) {
                  node.label = `${pkg.name}@${pkg.version}`;
                } else if (pkg.name && pkg.ref) {
                  node.label = `${pkg.name}#${pkg.ref}`;
                } else {
                  node.label = `${pkg.name}`;
                }

                node.label = newPkg ? chalk.green(node.label) : chalk.yellow(node.label);

                fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));
                resolve([node, pkg]);
              });
            });

          fstream.Reader({ path: path.join('./diamond/packages', pkg.path), type: 'Directory' })
            .pipe(tar.Pack({ noProprietary: true }))
            .pipe(zlib.createGzip())
            .pipe(writeStream);
        });
      });

      gzip.pipe(extract);
      req.pipe(passthrough);
    }
  });
});
