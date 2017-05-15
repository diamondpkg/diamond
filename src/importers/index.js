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
      pkg = packages.find(p => p.path === match[1]);
    }

    if (!pkg) {
      release();
      return Promise.reject(new Error(`could not find package '${match[1]}'`));
    }

    let p;
    if (match[2]) {
      release();
      try {
        fs.accessSync(path.join(process.cwd(), 'diamond/packages', pkg.path, match[2]));
      } catch (err) {
        return Promise.reject(new Error(`could not find file '${path.join(match[1], match[2])}'`));
      }

      p = path.join(process.cwd(), 'diamond/packages', pkg.path, match[2]);
    } else if (pkg.main) {
      release();
      try {
        fs.accessSync(path.join(process.cwd(), 'diamond/packages', pkg.path, pkg.main));
      } catch (err) {
        return Promise.reject(new Error(`could not find file '${path.join(match[1], pkg.main)}' this is likely a problem with the package itself`));
      }

      if (regex[lang].test(pkg.main)) {
        p = path.join(process.cwd(), 'diamond/packages', pkg.path, pkg.main);
      } else {
        try {
          fs.accessSync(path.join(process.cwd(), 'diamond/packages', pkg.path, 'diamond/dist/main.css'));
        } catch (err) {
          return Promise.reject(new Error('could not find dist files, try reinstalling'));
        }

        p = path.join(process.cwd(), 'diamond/packages', pkg.path, 'diamond/dist/main.css');
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