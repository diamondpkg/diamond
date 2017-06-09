'use strict';

const npm = require('./npm');
const github = require('./github');
const gitlab = require('./gitlab');
const diamond = require('./diamond');
const os = require('os');
const fs = require('fs-extra');
const stream = require('stream');
const path = require('path');
const childProcess = require('child_process');
const log = require('npmlog');
const bluebird = require('bluebird');
const lockfile = require('proper-lockfile');
const chalk = require('chalk');
const superagent = require('superagent');
const tar = require('tar');
const zlib = require('zlib');
const crypto = require('crypto');
const fstream = require('fstream');
const userAgent = require('../../misc/userAgent');
const compile = require('../compile');
const parsePackageObject = require('../parsePackageObject');
const convertStylus = require('css-to-stylus-converter');
const co = require('co');

module.exports = (pkg, options) => new Promise(co.wrap(function* fn(resolve) {
  let packages;
  const node = { nodes: [] };

  const release = yield bluebird.promisify(lockfile.lock)('./diamond/.internal/packages.lock');

  try {
    packages = JSON.parse(yield fs.readFile('./diamond/.internal/packages.lock'));
  } catch (err) {
    packages = [];
  }

  let data;
  if (pkg.source.type === 'npm') {
    data = yield npm(packages, pkg);
  } else if (pkg.source.type === 'github') {
    data = yield github(packages, pkg);
  } else if (pkg.source.type === 'gitlab') {
    data = yield gitlab(packages, pkg);
  } else if (pkg.source.type === 'diamond') {
    data = yield diamond(packages, pkg);
  }

  const info = data[0];
  const url = data[1];
  const shasum = data[2];

  if (info && info._type === 'diamond') {
    pkg.name = pkg.name || info.name || pkg.source.repo;
    pkg.version = info.version;
    pkg.main = info.main;
    pkg.postProcessor = info.postProcessor;
    pkg.functions = info.sass ? info.sass.functions : null;
    pkg.importer = info.sass ? info.sass.importer : null;
    pkg.dependencies = info.dependencies || {};
  } else if (info._type !== 'diamond') {
    pkg.name = pkg.name || info.name;
    pkg.version = info.version;
    pkg.main = info.diamond || info.sass || info.less || (info.main && !info.main.endsWith('.js') ? info.main : info.style);
  } else {
    pkg.name = pkg.name || pkg.source.repo;
  }

  let index = 0;
  const newPkg = !packages.find(p => p.name === pkg.name);

  const old = packages.find((p, i) => {
    index = i;
    return p.path === pkg.name;
  });

  if (old && old.for && !old.version !== pkg.version) {
    yield fs.ensureDir(`./diamond/packages/${old.for}/diamond/packages`);
    yield fs.rename(`./diamond/packages/${old.name}`, `./diamond/packages/${old.for}/diamond/packages/${old.name}`);
    old.path = `${old.for}/diamond/packages/${old.name}`;
    packages[index] = old;
  } else if (old) {
    packages.splice(index, 1);
  }

  index = 0;
  const found = packages.find((p, i) => {
    index = i;
    return p.name === pkg.name && p.for === pkg.for;
  });

  if (pkg.for && found) {
    yield fs.ensureDir(`./diamond/packages/${pkg.for}/diamond/packages`);
    yield fs.remove(`./diamond/packages/${pkg.for}/diamond/packages/${pkg.name}`);
    packages.splice(index, 1);
    pkg.path = `${pkg.for}/diamond/packages/${pkg.name}`;
  } else {
    yield fs.remove(`./diamond/packages/${pkg.name}`);
    if (found) {
      packages.splice(index, 1);
    }
    pkg.path = pkg.name;
  }

  packages.push(pkg);

  let verString = '';
  if (pkg.version) verString = `@${pkg.version}`;
  else if (pkg.ref) verString = `#${pkg.ref}`;

  if (options.cache && (yield fs.pathExists(path.join(os.homedir(), `.diamond/package-cache/${pkg.source.type}`, `${pkg.name}${verString}.tar.gz`)))) {
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

    extract.on('end', co.wrap(function* end() {
      log.disableProgress();
      log.setGaugeTemplate([
        { type: 'progressbar', length: 20 },
        { type: 'activityIndicator', kerning: 1, length: 1 },
        { type: 'section', default: '' },
        ':',
        { type: 'logline', kerning: 1, default: '' },
      ]);

      yield fs.writeFile('./diamond/.internal/packages.lock', JSON.stringify(packages));

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

      release();

      for (const dep of dependencies) {
        node.nodes.push((yield module.exports(dep, options))[0]);
      }

      if (pkg.name && pkg.version) {
        node.label = `${pkg.name}@${pkg.version}`;
      } else if (pkg.name && pkg.ref) {
        node.label = `${pkg.name}#${pkg.ref}`;
      } else {
        node.label = `${pkg.name}`;
      }

      node.label = newPkg ? chalk.green(node.label) : chalk.yellow(node.label);
      node.label = `${node.label} ${chalk.cyan('(from cache)')}`;

      resolve([node, pkg]);
    }));

    fs.createReadStream(path.join(os.homedir(), `.diamond/package-cache/${pkg.source.type}`, `${pkg.name}${verString}.tar.gz`))
      .pipe(zlib.createGunzip())
      .pipe(extract);
  } else {
    if (global.offline) throw new Error('offline');

    const req = superagent.get(url).set(userAgent.superagent);
    const passthrough = new stream.PassThrough();
    const gzip = zlib.createGunzip();
    const extract = tar.Extract({
      path: path.join('./diamond/packages', pkg.path),
      strip: pkg.source.type === 'diamond' ? 0 : 1,
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
        log.warn('no diamond.json', `${pkg.source.owner}/${pkg.source.repo}#${pkg.source.ref}`);
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

    extract.on('end', co.wrap(function* end() {
      log.disableProgress();
      log.setGaugeTemplate([
        { type: 'progressbar', length: 20 },
        { type: 'activityIndicator', kerning: 1, length: 1 },
        { type: 'section', default: '' },
        ':',
        { type: 'logline', kerning: 1, default: '' },
      ]);

      if (shasum && shasum !== crypto.createHash(pkg.source.type === 'diamond' ? 'sha256' : 'sha1')
          .update(contents, 'utf8').digest('hex')) {
        log.disableProgress();
        log.resume();
        yield fs.remove(path.join('./diamond/packages'), pkg.path);
        log.error('shasum does not match', pkg.name);
        log.error('not ok');
        process.exit(1);
      }

      yield fs.writeFile('./diamond/.internal/packages.lock', JSON.stringify(packages));

      yield fs.ensureDir(path.join('./diamond/packages', pkg.path, 'diamond/dist'));

      log.setGaugeTemplate([
        { type: 'activityIndicator', kerning: 1, length: 1 },
        { type: 'section', default: '' },
        ':',
        { type: 'logline', kerning: 1, default: '' },
      ]);

      if (pkg.postProcessor || pkg.functions || pkg.importer) {
        try {
          childProcess.execSync('npm i', { cwd: path.join('./diamond/packages', pkg.path), stdio: 'inherit' });
        } catch (err) {
          log.disableProgress();
          log.resume();
          yield bluebird.promisify(lockfile.unlock)('./diamond/.internal/packages.lock');
          log.error('npm', err.message);
          log.error('not ok');
          process.exit(1);
        }
      }

      yield fs.writeFile('./diamond/.internal/packages.lock', JSON.stringify(packages));

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

      release();

      for (const dep of dependencies) {
        node.nodes.push((yield module.exports(dep, options))[0]);
      }

      const pulse = () => log.gauge.pulse();
      if (/\.sass|\.scss|\.less|\.styl/.test(pkg.main)) {
        log.enableProgress();
        setInterval(pulse, 100);

        log.gauge.show({ section: 'compiling', logline: pkg.main }, 0);
        const css = yield compile(path.join(process.cwd(), 'diamond/packages', pkg.path, pkg.main), { minify: true });

        yield [
          fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.css'), css),
          fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.scss'), css),
          fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.styl'), convertStylus(css)),
        ];

        log.gauge.show({ section: 'compiling', logline: pkg.main }, 1);
      }

      clearInterval(pulse);
      log.disableProgress();
      log.setGaugeTemplate([
        { type: 'progressbar', length: 20 },
        { type: 'activityIndicator', kerning: 1, length: 1 },
        { type: 'section', default: '' },
        ':',
        { type: 'logline', kerning: 1, default: '' },
      ]);

      if (pkg.main.endsWith('.css')) {
        yield [
          fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.scss'), yield fs.readFile(path.join('./diamond/packages', pkg.path, pkg.main), 'utf8')),
          fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.styl'), convertStylus(yield fs.readFile(path.join('./diamond/packages', pkg.path, pkg.main), 'utf8'))),
        ];
      }

      const finish = () => {
        if (pkg.name && pkg.version) {
          node.label = `${pkg.name}@${pkg.version}`;
        } else if (pkg.name && pkg.ref) {
          node.label = `${pkg.name}#${pkg.ref}`;
        } else {
          node.label = `${pkg.name}`;
        }

        node.label = newPkg ? chalk.green(node.label) : chalk.yellow(node.label);

        resolve([node, pkg]);
      };

      yield fs.ensureDir(path.join(os.homedir(), `.diamond/package-cache/${pkg.source.type}`));

      if (pkg.source.type === 'npm' || pkg.source.type === 'diamond') {
        const writeStream = fs.createWriteStream(path.join(os.homedir(), `.diamond/package-cache/${pkg.source.type}`, `${pkg.name}${verString}.tar.gz`))
          .on('finish', finish);

        fstream.Reader({ path: path.join('./diamond/packages', pkg.path), type: 'Directory' })
          .pipe(tar.Pack({ noProprietary: true }))
          .pipe(zlib.createGzip())
          .pipe(writeStream);
      } else finish();
    }));

    gzip.pipe(extract);
    req.pipe(passthrough);
  }
}));
