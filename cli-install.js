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

function writeFiles(config, slug, regex, extensions, result) {
  for (const extension of extensions) {
    fs.writeFileSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/${config.main.replace(regex, extension)}`, result);
  }
}

function installPackage(pkg, callback) {
  if (!/((.+)\/([^#@\s]+))(#?@?(.+)?)/.test(pkg)) {
    log.error('invalid package', pkg);
    log.error('not ok');
    process.exit(1);
  }

  const match = pkg.match(/((.+)\/([^#@\s]+))(#?@?(.+)?)/);
  const slug = {
    owner: match[2],
    repo: match[3],
    ref: match[5] || 'master',
  };

  const stream = targz().createWriteStream('./diamond/tmp');
  const req = superagent.get(`https://github.com/${slug.owner}/${slug.repo}/archive/${slug.ref}.tar.gz`);

  req.on('response', (res) => {
    if (res.status !== 200) {
      log.error(`error while downloading: ${res.status}`, pkg);
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
    let tmpFile;
    for (const file of fs.readdirSync('./diamond/tmp')) {
      if (file.match(new RegExp(`${slug.repo}-${slug.ref}`, 'i'))) {
        tmpFile = file;
        break;
      }
    }

    if (!tmpFile) {
      log.error('error after downloading', pkg);
      log.error('not ok');
      process.exit(1);
    }

    fs.removeSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}`);
    fs.ensureDirSync(`./diamond/packages/${slug.owner}/`);
    fs.renameSync(`./diamond/tmp/${tmpFile}`, `./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}`);
    if (fs.existsSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.yml`) || fs.existsSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.json`)) {
      let config;

      if (fs.existsSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.yml`)) {
        config = yaml.parse(fs.readFileSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.yml`));
        if (!config) config = {};
      } else {
        try {
          config = JSON.parse(fs.readFileSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.json`));
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

        if (config.main && fs.existsSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/${config.main}`)) {
          if (!config.type || config.type === 'stylesheet' || mime.lookup(config.main) === 'text/css') {
            if (mime.lookup(config.main) === 'text/x-sass' || mime.lookup(config.main) === 'text/x-scss') {
              const result = sass.renderSync({
                data: fs.readFileSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/${config.main}`, 'utf8'),
                includePaths: ['.', './diamond', `./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}`],
                indentedSyntax: mime.lookup(config.main) === 'text/x-sass',
              });
              const regex = new RegExp(`${mime.extension(mime.lookup(config.main))}$`);
              writeFiles(config, slug, regex, ['less', 'css', 'styl'], result.css);
            } else if (mime.lookup(config.main) === 'text/less') {
              let result;
              try {
                result = childProcess.execSync(`"${__dirname}/node_modules/.bin/lessc" --include-path="diamond:diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}" diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/${config.main}`);
              } catch (err) {
                if (err.status === 127) {
                  try {
                    result = childProcess.execSync(`lessc --include-path="diamond:diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}" diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/${config.main}`);
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
              writeFiles(config, slug, regex, ['scss', 'css', 'styl'], result);
            } else if (mime.lookup(config.main) === 'text/stylus') {
              let result;
              try {
                result = childProcess.execSync(`"${__dirname}/node_modules/.bin/stylus" -I diamond -I diamond/packages/${slug.owner}/${slug.repo}@${slug.ref} -p diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/${config.main}`);
              } catch (err) {
                if (err.status === 127) {
                  try {
                    result = childProcess.execSync(`stylus -I diamond -I diamond/packages/${slug.owner}/${slug.repo}@${slug.ref} -p diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/${config.main}`);
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
              writeFiles(config, slug, regex, ['scss', 'css', 'less'], result);
            } else if (mime.lookup(config.main) === 'text/css') {
              const result = fs.readFileSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/${config.main}`, 'utf8');
              const regex = new RegExp(`${mime.extension(mime.lookup(config.main))}$`);
              writeFiles(config, slug, regex, ['less', 'scss', 'styl'], result);
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

program.parse(process.argv);

const pkgs = program.args;

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
config.dependencies = config.dependencies.filter((i, p) => config.dependencies.indexOf(i) === p);

if (packages.length === 0) {
  log.info('no packages to install');
  log.info('ok');
  process.exit(0);
}

let existingPackages = [];
if (fs.existsSync('./diamond/internal/packages.json')) {
  try {
    existingPackages = JSON.parse(fs.readFileSync('./diamond/internal/packages.json'));
  } catch (err) { } // eslint-disable-line
}

fs.ensureDirSync('./diamond/packages');
fs.ensureDirSync('./diamond/tmp');
fs.ensureFileSync('./diamond/internal/packages.json');

async.each(packages, (pkg, callback) => {
  installPackage(pkg, callback);
}, () => {
  installedPackages = installedPackages.concat(existingPackages);
  installedPackages = installedPackages.filter((i, p) => installedPackages.indexOf(i) === p);

  fs.writeFileSync('./diamond/internal/packages.json', JSON.stringify(installedPackages));

  fs.writeFileSync('./diamond/autoload.scss', `/* diamond autoload file - generated on ${new Date()} */\n`);
  fs.writeFileSync('./diamond/autoload.less', `/* diamond autoload file - generated on ${new Date()} */\n`);
  fs.writeFileSync('./diamond/autoload.styl', `/* diamond autoload file - generated on ${new Date()} */\n`);
  fs.writeFileSync('./diamond/autoload.css', `/* diamond autoload file - generated on ${new Date()} */\n`);

  for (const pkg of installedPackages) {
    const match = pkg.match(/((.+)\/([^#@\s]+))(#?@?(.+)?)/);
    const slug = {
      owner: match[2],
      repo: match[3],
      ref: match[5] || 'master',
    };

    if (fs.existsSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.yml`) || fs.existsSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.json`)) {
      let pkgCfg;

      if (fs.existsSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.yml`)) {
        pkgCfg = yaml.parse(fs.readFileSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.yml`));
        if (!pkgCfg) pkgCfg = {};
      } else {
        try {
          pkgCfg = JSON.parse(fs.readFileSync(`./diamond/packages/${slug.owner}/${slug.repo}@${slug.ref}/diamond.json`));
        } catch (err) {
          pkgCfg = {};
        }
      }

      if (!pkgCfg.type || pkgCfg.type === 'stylesheet' || mime.lookup(pkgCfg.main) === 'text/css') {
        if (mime.lookup(pkgCfg.main) === 'text/x-sass' || mime.lookup(pkgCfg.main) === 'text/x-scss') {
          const regex = new RegExp(`${mime.extension(mime.lookup(pkgCfg.main))}$`);
          fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main}';`);
          fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'less')}';`);
          fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'styl')}';`);
          fs.appendFileSync('./diamond/autoload.css', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'css')}';`);
        } else if (mime.lookup(pkgCfg.main) === 'text/less') {
          const regex = new RegExp(`${mime.extension(mime.lookup(pkgCfg.main))}$`);
          fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main}';`);
          fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'scss')}';`);
          fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'styl')}';`);
          fs.appendFileSync('./diamond/autoload.css', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'css')}';`);
        } else if (mime.lookup(pkgCfg.main) === 'text/stylus') {
          const regex = /styl$|stylus$/;
          fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main}';`);
          fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'less')}';`);
          fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'scss')}';`);
          fs.appendFileSync('./diamond/autoload.css', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'css')}';`);
        } else if (mime.lookup(pkgCfg.main) === 'text/css') {
          const regex = new RegExp(`${mime.extension(mime.lookup(pkgCfg.main))}$`);
          fs.appendFileSync('./diamond/autoload.css', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main}';`);
          fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'less')}';`);
          fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'styl')}';`);
          fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main.replace(regex, 'scss')}';`);
        }
      } else if (mime.lookup(pkgCfg.main) === 'text/x-sass' || mime.lookup(pkgCfg.main) === 'text/x-scss') {
        log.warn('SASS is only supported by the package', pkg);
        fs.appendFileSync('./diamond/autoload.scss', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main}';`);
      } else if (mime.lookup(pkgCfg.main) === 'text/less') {
        log.warn('LESS is only supported by the package', pkg);
        fs.appendFileSync('./diamond/autoload.less', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main}';`);
      } else if (mime.lookup(pkgCfg.main) === 'text/stylus') {
        log.warn('Stylus is only supported by the package', pkg);
        fs.appendFileSync('./diamond/autoload.styl', `\n@import 'packages/${slug.owner}/${slug.repo}@${slug.ref}/${pkgCfg.main}';`);
      }
    }
  }

  if (yamlConfig) fs.writeFileSync('./diamond.yml', yaml.dump(config));
  else fs.writeFileSync('./diamond.json', JSON.stringify(config));

  log.info('ok');
  process.exit(0);
});

