'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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

module.exports = (pkg, options) => new Promise((() => {
  var _ref = _asyncToGenerator(function* (resolve) {
    let packages;
    const node = { nodes: [] };

    const release = lockfile.lockSync('./diamond/.internal/packages.lock');

    try {
      packages = JSON.parse((yield fs.readFile('./diamond/.internal/packages.lock')));
    } catch (err) {
      packages = [];
    }

    let info = null,
        url = null,
        shasum = null;

    if (pkg.source.type === 'npm') {
      var _ref2 = yield npm(packages, pkg);

      var _ref3 = _slicedToArray(_ref2, 3);

      info = _ref3[0];
      url = _ref3[1];
      shasum = _ref3[2];
    } else if (pkg.source.type === 'github') {
      var _ref4 = yield github(packages, pkg);

      var _ref5 = _slicedToArray(_ref4, 3);

      info = _ref5[0];
      url = _ref5[1];
      shasum = _ref5[2];
    } else if (pkg.source.type === 'gitlab') {
      var _ref6 = yield gitlab(packages, pkg);

      var _ref7 = _slicedToArray(_ref6, 3);

      info = _ref7[0];
      url = _ref7[1];
      shasum = _ref7[2];
    } else if (pkg.source.type === 'diamond') {
      var _ref8 = yield diamond(packages, pkg);

      var _ref9 = _slicedToArray(_ref8, 3);

      info = _ref9[0];
      url = _ref9[1];
      shasum = _ref9[2];
    }

    if (info && pkg.source.type !== 'npm') {
      pkg.name = pkg.name || info.name || pkg.source.repo;
      pkg.version = info.version;
      pkg.main = info.main;
      pkg.postProcessor = info.postProcessor;
      pkg.functions = info.sass ? info.sass.functions : null;
      pkg.importer = info.sass ? info.sass.importer : null;
      pkg.dependencies = info.dependencies || {};
    } else if (pkg.source.type === 'npm') {
      pkg.name = pkg.name || info.name;
      pkg.version = info.version;
      pkg.main = info.diamond || info.sass || info.less || (info.main && !info.main.endsWith('.js') ? info.main : info.style);
    } else {
      pkg.name = pkg.name || pkg.source.repo;
    }

    let index = 0;
    const newPkg = !packages.find(function (p) {
      return p.name === pkg.name;
    });

    const old = packages.find(function (p, i) {
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
    const found = packages.find(function (p, i) {
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
    if (pkg.version) verString = `@${pkg.version}`;else if (pkg.ref) verString = `#${pkg.ref}`;

    if (pkg.source.type === 'diamond' && options.cache && fs.existsSync(path.join(os.homedir(), '.diamond/package-cache', `${pkg.name}${verString}.tar.gz`))) {
      const extract = tar.Extract({ path: path.join('./diamond/packages') });

      log.setGaugeTemplate([{ type: 'activityIndicator', kerning: 1, length: 1 }, { type: 'section', default: '' }, ':', { type: 'logline', kerning: 1, default: '' }]);
      log.enableProgress();

      extract.on('entry', function (entry) {
        log.gauge.show({ section: 'extract', logline: entry.path });
        log.gauge.pulse();
      });

      extract.on('end', _asyncToGenerator(function* () {
        log.disableProgress();
        log.setGaugeTemplate([{ type: 'progressbar', length: 20 }, { type: 'activityIndicator', kerning: 1, length: 1 }, { type: 'section', default: '' }, ':', { type: 'logline', kerning: 1, default: '' }]);

        yield fs.writeFile('./diamond/.internal/packages.lock', JSON.stringify(packages));

        const dependencies = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = parsePackageObject(pkg.dependencies)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            const source = _step.value;

            dependencies.push({
              name: source.name,
              version: source.version,
              path: null,
              for: pkg.path,
              source
            });
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        release();

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = dependencies[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            const dep = _step2.value;

            var _ref11 = yield module.exports(dep, options),
                _ref12 = _slicedToArray(_ref11, 1);

            const n = _ref12[0];

            node.nodes.push(n);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
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
        node.label = `${node.label} ${chalk.cyan('(from cache)')}`;

        resolve([node, pkg]);
      }));

      fs.createReadStream(path.join(os.homedir(), '.diamond/package-cache', `${pkg.name}${verString}.tar.gz`)).pipe(zlib.createGunzip()).pipe(extract);
    } else {
      const req = superagent.get(url).set(userAgent.superagent);
      const passthrough = new stream.PassThrough();
      const gzip = zlib.createGunzip();
      const extract = tar.Extract({
        path: path.join('./diamond/packages', pkg.path),
        strip: pkg.source.type === 'diamond' ? 0 : 1
      });

      let contents = Buffer.alloc(0);

      req.on('response', function (r) {
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

      passthrough.on('data', function (buf) {
        contents = Buffer.concat([contents, buf]);
        gzip.write(buf);
      });

      passthrough.on('end', function () {
        return gzip.end();
      });

      log.setGaugeTemplate([{ type: 'activityIndicator', kerning: 1, length: 1 }, { type: 'section', default: '' }, ':', { type: 'logline', kerning: 1, default: '' }]);
      log.enableProgress();

      extract.on('entry', function (entry) {
        log.gauge.show({ section: 'extract', logline: entry.path });
        log.gauge.pulse();
      });

      extract.on('end', _asyncToGenerator(function* () {
        log.disableProgress();
        log.setGaugeTemplate([{ type: 'progressbar', length: 20 }, { type: 'activityIndicator', kerning: 1, length: 1 }, { type: 'section', default: '' }, ':', { type: 'logline', kerning: 1, default: '' }]);

        if (shasum && shasum !== crypto.createHash(pkg.source.type === 'diamond' ? 'sha256' : 'sha1').update(contents, 'utf8').digest('hex')) {
          log.disableProgress();
          log.resume();
          yield fs.remove(path.join('./diamond/packages'), pkg.path);
          log.error('shasum does not match', pkg.name);
          log.error('not ok');
          process.exit(1);
        }

        yield fs.writeFile('./diamond/.internal/packages.lock', JSON.stringify(packages));

        yield fs.ensureDir(path.join('./diamond/packages', pkg.path, 'diamond/dist'));

        log.setGaugeTemplate([{ type: 'activityIndicator', kerning: 1, length: 1 }, { type: 'section', default: '' }, ':', { type: 'logline', kerning: 1, default: '' }]);

        if (pkg.postProcessor || pkg.functions || pkg.importer) {
          try {
            childProcess.execSync('npm i', { cwd: path.join('./diamond/packages', pkg.path), stdio: 'inherit' });
          } catch (err) {
            log.disableProgress();
            log.resume();
            lockfile.unlockSync('./diamond/.internal/packages.lock');
            log.error('npm', err.message);
            log.error('not ok');
            process.exit(1);
          }
        }

        yield fs.writeFile('./diamond/.internal/packages.lock', JSON.stringify(packages));

        const dependencies = [];
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = parsePackageObject(pkg.dependencies)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            const source = _step3.value;

            dependencies.push({
              name: source.name,
              version: source.version,
              path: null,
              for: pkg.path,
              source
            });
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        release();

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = dependencies[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            const dep = _step4.value;

            var _ref14 = yield module.exports(dep, options),
                _ref15 = _slicedToArray(_ref14, 1);

            const n = _ref15[0];

            node.nodes.push(n);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        const pulse = function pulse() {
          return log.gauge.pulse();
        };
        if (/\.sass|\.scss|\.less|\.styl/.test(pkg.main)) {
          log.enableProgress();
          setInterval(pulse, 100);

          log.gauge.show({ section: 'compiling', logline: pkg.main }, 0);
          const css = yield compile(path.join(process.cwd(), 'diamond/packages', pkg.path, pkg.main), { outputStyle: 'compressed' });

          yield fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.css'), css);
          yield fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.scss'), css);
          yield fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.styl'), convertStylus(css));

          log.gauge.show({ section: 'compiling', logline: pkg.main }, 1);
        }

        clearInterval(pulse);
        log.disableProgress();
        log.setGaugeTemplate([{ type: 'progressbar', length: 20 }, { type: 'activityIndicator', kerning: 1, length: 1 }, { type: 'section', default: '' }, ':', { type: 'logline', kerning: 1, default: '' }]);

        if (pkg.main.endsWith('.css')) {
          yield fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.scss'), fs.readFileSync(path.join('./diamond/packages', pkg.path, pkg.main), 'utf8'));
          yield fs.writeFile(path.join('./diamond/packages', pkg.path, 'diamond/dist/main.styl'), convertStylus(fs.readFileSync(path.join('./diamond/packages', pkg.path, pkg.main), 'utf8')));
        }

        const finish = function finish() {
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

        if (pkg.source.type === 'diamond') {
          yield fs.ensureDir(path.join(os.homedir(), '.diamond/package-cache'));

          const writeStream = fs.createWriteStream(path.join(os.homedir(), '.diamond/package-cache', `${pkg.name}${verString}.tar.gz`)).on('finish', finish);

          fstream.Reader({ path: path.join('./diamond/packages', pkg.path), type: 'Directory' }).pipe(tar.Pack({ noProprietary: true })).pipe(zlib.createGzip()).pipe(writeStream);
        } else finish();
      }));

      gzip.pipe(extract);
      req.pipe(passthrough);
    }
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})());