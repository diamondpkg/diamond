#! /usr/bin/env node

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

function writeFiles(config, match, regex, extensions, result) {
  for (const extension of extensions) {
    fs.writeFileSync(`./diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}/${config.main.replace(regex, extension)}`, result);
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
  const read = superagent.get(`https://github.com/${match[2]}/${match[3]}/archive/${match[5] || 'master'}.tar.gz`);

  stream.on('finish', () => {
    fs.removeSync(`./diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}`);
    fs.renameSync(`./diamond/tmp/${match[3]}-${match[5] || 'master'}`, `./diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}`);
    if (fs.existsSync(`./diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}/diamond.yml`)) {
      const config = yaml.readSync(`./diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}/diamond.yml`);
      if (!config.dependencies) {
        config.dependencies = [];
      }

      async.each(config.dependencies, (p, c) => {
        installPackage(p, c);
      }, () => {
        if (config.main && fs.existsSync(`./diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}/${config.main}`)) {
          if (!config.type || config.type === 'stylesheet') {
            if (mime.lookup(config.main) === 'text/x-sass' || mime.lookup(config.main) === 'text/x-scss') {
              const result = sass.renderSync({
                data: fs.readFileSync(`./diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}/${config.main}`, 'utf8'),
                includePaths: ['.', './diamond', `./diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}`],
                indentedSyntax: mime.lookup(config.main) === 'text/x-sass',
              });
              const regex = new RegExp(`${mime.extension(mime.lookup(config.main))}$`);
              writeFiles(config, match, regex, ['less', 'css', 'styl'], result);
            } else if (mime.lookup(config.main) === 'text/less') {
              const result = childProcess.execSync(`"node_modules/.bin/lessc" --include-path="diamond:diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}" diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}/${config.main}`);
              const regex = new RegExp(`${mime.extension(mime.lookup(config.main))}$`);
              writeFiles(config, match, regex, ['scss', 'css', 'styl'], result);
            } else if (mime.lookup(config.main) === 'text/stylus') {
              const result = childProcess.execSync(`"node_modules/.bin/stylus" -I diamond -I diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''} -p diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}/${config.main}`);
              const regex = /styl$|stylus$/;
              writeFiles(config, match, regex, ['scss', 'css', 'less'], result);
            } else if (mime.lookup(config.main) === 'text/css') {
              const result = fs.readFileSync(`./diamond/packages/${match[3]}${match[5] ? `@${match[5]}` : ''}/${config.main}`, 'utf8');
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
      log.warn('not a diamond package', pkg);
      callback();
    }
  });

  read.pipe(stream);
}

program
  .version('0.1.0')
  .command('install [packages...]')
  .action((pkgs) => {
    log.heading = 'dia';
    log.info('it worked if it ends with', 'ok');

    let packages = pkgs;

    let config;
    if (fs.existsSync('./diamond.yml')) {
      config = yaml.readSync('./diamond.yml');
    } else {
      config = {};
    }

    if (!config.dependencies) {
      config.dependencies = [];
    }

    config.dependencies = config.dependencies.concat(packages);

    if (packages.length === 0) {
      packages = config.dependencies;
    }

    if (packages.length === 0) {
      log.info('no packages to install');
      log.info('ok');
      process.exit(0);
    }

    fs.ensureFileSync('./diamond.yml');
    fs.ensureDirSync('./diamond/packages');
    fs.ensureDirSync('./diamond/tmp');

    async.each(packages, (pkg, callback) => {
      installPackage(pkg, callback);
    }, () => {
      yaml.writeSync('./diamond.yml', config);
      log.info('ok');
      process.exit(0);
    });
  });

program.parse(process.argv);
