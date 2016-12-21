#! /usr/bin/env node

'use strict';

const fs = require('fs-extra');
const log = require('npmlog');
const program = require('commander');
const superagent = require('superagent');
const targz = require('tar.gz');
const yaml = require('node-yaml');
const async = require('async');
const mime = require('mime-types');
const sass = require('node-sass');
const childProcess = require('child_process');
const ProgressBar = require('progress');

let installedPackages = [];

function writeFiles(config, match, regex, extensions, result) {
  for (const extension of extensions) {
    fs.writeFileSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${config.main.replace(regex, extension)}`, result);
  }
}

function installPackage(pkg, callback) {
  if (!/((.+)\/([^#@\s]+))(#?@?(.+)?)/.test(pkg)) {
    log.error('invalid package', pkg);
    log.error('not ok');
    process.exit(1);
  }

  const match = pkg.match(/((.+)\/([^#@\s]+))(#?@?(.+)?)/);
  const stream = targz().createWriteStream('./diamond/tmp');
  const req = superagent.get(`https://github.com/${match[2]}/${match[3]}/archive/${match[5] || 'master'}.tar.gz`);

  req.on('response', (res) => {
    if (res.status !== 200) {
      log.error('error while downloading', pkg);
      log.error('not ok');
      process.exit(1);
    }

    const len = parseInt(res.headers['content-length'], 10);

    const bar = new ProgressBar(`:etas :percent [:bar] ${pkg}`, {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len,
    });

    res.on('data', (chunk) => {
      bar.tick(chunk.length);
    });
  });

  stream.on('finish', () => {
    fs.removeSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}`);
    fs.ensureDirSync(`./diamond/packages/${match[2]}/`);
    fs.renameSync(`./diamond/tmp/${match[3]}-${match[5] || 'master'}`, `./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}`);
    if (fs.existsSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.yml`) || fs.existsSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.json`)) {
      let config;

      if (fs.existsSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.yml`)) {
        config = yaml.parse(fs.readFileSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.yml`));
        if (!config) config = {};
      } else {
        try {
          config = JSON.parse(fs.readFileSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.json`));
        } catch (err) {
          config = {};
        }
      }

      if (!config.dependencies) {
        config.dependencies = [];
      }

      config.dependencies = config.dependencies.map(p => p.toLowerCase());

      async.each(config.dependencies, (p, c) => {
        installPackage(p.toLowerCase(), c);
      }, () => {
        installedPackages.push(pkg);

        if (config.main && fs.existsSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${config.main}`)) {
          if (!config.type || config.type === 'stylesheet') {
            if (mime.lookup(config.main) === 'text/x-sass' || mime.lookup(config.main) === 'text/x-scss') {
              const result = sass.renderSync({
                data: fs.readFileSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${config.main}`, 'utf8'),
                includePaths: ['.', './diamond', `./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}`],
                indentedSyntax: mime.lookup(config.main) === 'text/x-sass',
              });
              const regex = new RegExp(`${mime.extension(mime.lookup(config.main))}$`);
              writeFiles(config, match, regex, ['less', 'css', 'styl'], result.css);
            } else if (mime.lookup(config.main) === 'text/less') {
              let result;
              try {
                result = childProcess.execSync(`"${__dirname}/node_modules/.bin/lessc" --include-path="diamond:diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}" diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${config.main}`);
              } catch (err) {
                if (err.status === 127) {
                  try {
                    result = childProcess.execSync(`lessc --include-path="diamond:diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}" diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${config.main}`);
                  } catch (e) {
                    if (e.status === 127) {
                      log.error('stylus executable not found');
                      log.error('not ok');
                      process.exit(1);
                    } else {
                      throw e;
                    }
                  }
                } else {
                  throw err;
                }
              }

              const regex = new RegExp(`${mime.extension(mime.lookup(config.main))}$`);
              writeFiles(config, match, regex, ['scss', 'css', 'styl'], result);
            } else if (mime.lookup(config.main) === 'text/stylus') {
              let result;
              try {
                result = childProcess.execSync(`"${__dirname}/node_modules/.bin/stylus" -I diamond -I diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'} -p diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${config.main}`);
              } catch (err) {
                if (err.status === 127) {
                  try {
                    result = childProcess.execSync(`stylus -I diamond -I diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'} -p diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${config.main}`);
                  } catch (e) {
                    if (e.status === 127) {
                      log.error('stylus executable not found');
                      log.error('not ok');
                      process.exit(1);
                    } else {
                      throw e;
                    }
                  }
                } else {
                  throw err;
                }
              }

              const regex = /styl$|stylus$/;
              writeFiles(config, match, regex, ['scss', 'css', 'less'], result);
            } else if (mime.lookup(config.main) === 'text/css') {
              const result = fs.readFileSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${config.main}`, 'utf8');
              const regex = new RegExp(`${mime.extension(mime.lookup(config.main))}$`);
              writeFiles(config, match, regex, ['less', 'scss', 'styl'], result);
            } else {
              log.warn('unsupported file type', pkg);
            }
          } else {
            log.verbose('not a stylesheet', pkg);
          }
        } else {
          log.warn('invalid main file', pkg);
        }
        callback();
      });
    } else {
      installedPackages.push(pkg);
      log.warn('not a diamond package', pkg);
      callback();
    }
  });

  req.pipe(stream);
}

program
  .version('0.1.0')
  .command('install [packages...]')
  .action((pkgs) => {
    log.heading = 'dia';
    log.info('it worked if it ends with', 'ok');

    let packages = pkgs;

    let config;
    let yamlConfig = false;
    if (fs.existsSync('./diamond.yml')) {
      config = yaml.parse(fs.readFileSync('./diamond.yml'));
      if (!config) config = {};
      yamlConfig = true;
    } else if (fs.existsSync('./diamond.json')) {
      try {
        config = JSON.parse(fs.readFileSync('./diamond.json'));
      } catch (err) {
        config = {};
      }
    } else {
      config = {};
      yamlConfig = true;
    }

    if (!config.dependencies) {
      config.dependencies = [];
    }

    config.dependencies = config.dependencies.concat(packages);

    if (packages.length === 0) {
      packages = config.dependencies;
    }

    packages = packages.map(p => p.toLowerCase());
    config.dependencies = config.dependencies.map(p => p.toLowerCase());

    if (packages.length === 0) {
      log.info('no packages to install');
      log.info('ok');
      process.exit(0);
    }

    let existingPackages = [];
    if (fs.existsSync('./diamond/internal/packages.json')) {
      existingPackages = JSON.parse(fs.readFileSync('./diamond/internal/packages.json'));
    }

    fs.ensureDirSync('./diamond/packages');
    fs.ensureDirSync('./diamond/tmp');
    fs.ensureFileSync('./diamond/internal/packages.json');

    async.each(packages, (pkg, callback) => {
      installPackage(pkg, callback);
    }, () => {
      installedPackages = Array.from(new Set(installedPackages.concat(existingPackages)));

      fs.writeFileSync('./diamond/internal/packages.json', JSON.stringify(installedPackages));

      fs.writeFileSync('./diamond/autoload.scss', `/* diamond autoload file - generated on ${new Date()} */\n`);
      fs.writeFileSync('./diamond/autoload.less', `/* diamond autoload file - generated on ${new Date()} */\n`);
      fs.writeFileSync('./diamond/autoload.styl', `/* diamond autoload file - generated on ${new Date()} */\n`);
      fs.writeFileSync('./diamond/autoload.css', `/* diamond autoload file - generated on ${new Date()} */\n`);

      for (const pkg of installedPackages) {
        const match = pkg.match(/((.+)\/([^#@\s]+))(#?@?(.+)?)/);

        if (fs.existsSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.yml`) || fs.existsSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.json`)) {
          let pkgCfg;

          if (fs.existsSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.yml`)) {
            pkgCfg = yaml.parse(fs.readFileSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.yml`));
            if (!pkgCfg) pkgCfg = {};
          } else {
            try {
              pkgCfg = JSON.parse(fs.readFileSync(`./diamond/packages/${match[2]}/${match[3]}@${match[5] || 'master'}/diamond.json`));
            } catch (err) {
              pkgCfg = {};
            }
          }

          if (!pkgCfg.type || pkgCfg.type === 'stylesheet') {
            if (mime.lookup(pkgCfg.main) === 'text/x-sass' || mime.lookup(pkgCfg.main) === 'text/x-scss') {
              const regex = new RegExp(`${mime.extension(mime.lookup(pkgCfg.main))}$`);
              fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main}';`);
              fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'less')}';`);
              fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'styl')}';`);
              fs.appendFileSync('./diamond/autoload.css', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'css')}';`);
            } else if (mime.lookup(pkgCfg.main) === 'text/less') {
              const regex = new RegExp(`${mime.extension(mime.lookup(pkgCfg.main))}$`);
              fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main}';`);
              fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'scss')}';`);
              fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'styl')}';`);
              fs.appendFileSync('./diamond/autoload.css', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'css')}';`);
            } else if (mime.lookup(pkgCfg.main) === 'text/stylus') {
              const regex = /styl$|stylus$/;
              fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main}';`);
              fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'less')}';`);
              fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'scss')}';`);
              fs.appendFileSync('./diamond/autoload.css', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'css')}';`);
            } else if (mime.lookup(pkgCfg.main) === 'text/css') {
              const regex = new RegExp(`${mime.extension(mime.lookup(pkgCfg.main))}$`);
              fs.appendFileSync('./diamond/autoload.css', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main}';`);
              fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'less')}';`);
              fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'styl')}';`);
              fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main.replace(regex, 'scss')}';`);
            }
          } else if (mime.lookup(pkgCfg.main) === 'text/x-sass' || mime.lookup(pkgCfg.main) === 'text/x-scss') {
            fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main}';`);
          } else if (mime.lookup(pkgCfg.main) === 'text/less') {
            fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main}';`);
          } else if (mime.lookup(pkgCfg.main) === 'text/stylus') {
            fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main}';`);
          } else if (mime.lookup(pkgCfg.main) === 'text/css') {
            fs.appendFileSync('./diamond/autoload.css', `\n@import 'packages/${match[2]}/${match[3]}@${match[5] || 'master'}/${pkgCfg.main}';`);
          }
        }
      }

      if (yamlConfig) fs.writeFileSync('./diamond.json', yaml.dump(config));
      else fs.writeFileSync('./diamond.json', JSON.stringify(config));

      log.info('ok');
      process.exit(0);
    });
  });

program.parse(process.argv);
