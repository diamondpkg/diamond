'use strict';

const npm = require('./npm');
const github = require('./github');
const gitlab = require('./gitlab');
const os = require('os');
const readline = require('readline');
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
const gonzales = require('gonzales-pe');
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
      pkg.postProcessor = info.diamond ?
        info.diamond.postProcessor || info.diamond.postCompile :
        null;
      pkg.functions = info.diamond && info.diamond.sass ? info.diamond.sass.functions : null;
      pkg.importer = info.diamond && info.diamond.sass ? info.diamond.sass.importer : null;
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
          fs.removeSync(path.join('./diamond/packages'), pkg.path);
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

          const promises = [];
          if (options.betaNamespacing) {
            for (const p of klaw(path.join('./diamond/packages', pkg.path), { ignore: 'diamond/packages' })) {
              if (!/\.sass|\.scss$/.test(p.path)) continue;

              let parseTree;
              try {
                parseTree = gonzales.parse(fs.readFileSync(p.path).toString(), { syntax: p.path.endsWith('sass') ? 'sass' : 'scss' });
              } catch (err) {
                parseTree = null;
              }

              if (parseTree) {
                promises.push(new Promise((rsolve) => {
                  parseTree.traverseByType('class', (childNode) => {
                    if (typeof childNode.content[0].content === 'string') {
                      childNode.content[0].content = `#{$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__}${childNode.content[0].content}`;
                    } else {
                      childNode.content[0].content.unshift(gonzales.createNode({
                        type: 'ident',
                        syntax: p.path.endsWith('sass') ? 'sass' : 'scss',
                        content: `#{$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__}`,
                      }));
                    }

                    return childNode;
                  });

                  fs.writeFileSync(p.path, parseTree.toString());
                  rsolve();
                }));
              } else {
                promises.push(new Promise((rsolve) => {
                  let content = '';
                  readline.createInterface({ input: fs.createReadStream(p.path) })
                    .on('line', (line) => {
                      if (/[@$][^!"#$%&'()*+,./:;<=>?@[\]^{|}~]+[:=]|["']/.test(line)) return content += `${line}\n`;

                      content += line.replace(/\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*(\s*))/g, match =>
                        match.replace(/\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*(\s*))/g, (_, name, space) =>
                          `.#{$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__}${name}${space}`));

                      content += '\n';

                      return null;
                    })
                    .on('close', () => {
                      fs.writeFile(p.path, content, () => {
                        rsolve();
                      });
                    });
                }));
              }
            }
          }

          Promise.all(promises).then(() => {
            const finish = () => {
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
            };

            if (pkg.source.type === 'npm') {
              fs.ensureDirSync(path.join(os.homedir(), '.diamond/package-cache'));

              const writeStream = fs.createWriteStream(path.join(os.homedir(), '.diamond/package-cache', `${pkg.name}${verString}.tar.gz`))
                .on('finish', finish);

              fstream.Reader({ path: path.join('./diamond/packages', pkg.path), type: 'Directory' })
                .pipe(tar.Pack({ noProprietary: true }))
                .pipe(zlib.createGzip())
                .pipe(writeStream);
            } else finish();
          });
        });
      });

      gzip.pipe(extract);
      req.pipe(passthrough);
    }
  });
});
