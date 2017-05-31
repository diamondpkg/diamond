'use strict';

const unify = require('unifycss');
const fs = require('fs-extra');
const path = require('path');
const lockfile = require('proper-lockfile');

const plugin = new unify.PluginManager();

const regex = {
  less: /\.less$/,
  sass: /\.sass|\.scss$/,
  stylus: /\.styl$/,
};

function packagePath(pkg) {
  if (pkg.current) return '';
  return path.join('diamond/packages', pkg.path);
}

class Importer extends unify.ImportController {
  supports(name) {
    return /^~([^\s/]+)(.*)$/.test(name);
  }

  handler(lang, filename, cd) {
    fs.ensureDirSync('./diamond/.staging');
    fs.ensureDirSync('./diamond/packages');
    fs.ensureFileSync('./diamond/.internal/packages.lock');

    const release = lockfile.lockSync('./diamond/.internal/packages.lock');

    let packages;

    try {
      packages = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
    } catch (err) {
      packages = [];
    }

    let current;
    try {
      current = JSON.parse(fs.readFileSync('./diamond.json'));
    } catch (err) {
      try {
        current = JSON.parse(fs.readFileSync('./package.json'));
      } catch (_) {
        current = {};
      }
    }

    if (current.name) {
      packages.push({
        name: current.name,
        current: true,
        version: current.version,
        main: current.diamond || current.sass || current.less || (current.main && !current.main.endsWith('.js') ? current.main : current.style),
      });
    }

    if (!packages.length) {
      release();
      return Promise.reject(new Error('no packages installed'));
    }

    const match = filename.match(/^~([^\s/]+)(.*)$/);

    let pkg;
    if (/^packages\/([^/]+).+/.test(path.relative(__dirname, cd))) {
      pkg = packages.find((p) => {
        const currentPkg = path.relative(__dirname, cd).match(/^packages\/([^/]+).+/)[1];
        return p.path === `${currentPkg}/diamond/packages/${match[1]}`;
      }) || packages.find(p => p.path === match[1]);
    } else {
      pkg = packages.find(p => p.path === match[1]) ||
        packages.find(p => p.current && p.name === match[1]);
    }

    if (!pkg) {
      release();
      return Promise.reject(new Error(`could not find package '${match[1]}'`));
    }

    let p;
    if (match[2]) {
      release();
      try {
        fs.accessSync(path.join(process.cwd(), packagePath(pkg), match[2]));
      } catch (err) {
        return Promise.reject(new Error(`could not find file '${path.join(match[1], match[2])}'`));
      }

      p = path.join(process.cwd(), packagePath(pkg), match[2]);
    } else if (pkg.main) {
      release();
      try {
        fs.accessSync(path.join(process.cwd(), packagePath(pkg), pkg.main));
      } catch (err) {
        return Promise.reject(new Error(`could not find file '${path.join(match[1], pkg.main)}' this is likely a problem with the package itself`));
      }

      if (regex[lang].test(pkg.main) || (/\.css/.test(pkg.main) && lang !== 'stylus')) {
        p = path.join(process.cwd(), packagePath(pkg), pkg.main);
      } else {
        try {
          fs.accessSync(path.join(process.cwd(), packagePath(pkg), lang !== 'stylus' ? 'diamond/dist/main.css' : 'diamond/dist/main.styl'));
        } catch (err) {
          return Promise.reject(new Error('could not find dist files, try reinstalling'));
        }

        p = path.join(process.cwd(), packagePath(pkg), lang !== 'stylus' ? 'diamond/dist/main.css' : 'diamond/dist/main.styl');
      }
    } else {
      release();
      return Promise.reject(new Error('the package has no mainfile! you need to import files from this package manually'));
    }

    return p;
  }
}

plugin.add(new Importer());

module.exports = plugin;
