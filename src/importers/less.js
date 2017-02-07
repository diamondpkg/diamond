'use strict';

const path = require('path');
const fs = require('fs-extra');
const lockfile = require('proper-lockfile');

module.exports = {
  install: (less, pluginManager) => {
    class Importer extends less.FileManager {
      constructor() {
        super();

        this.supportsSync = this.supports;
      }

      supports(name) {
        return /^\[([^\s/]+)(.+)?](\s+as\s+([a-zA-Z]+))?$/.test(name);
      }

      loadFile(filename, currentDirectory, options, environment) {
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

        const match = filename.match(/^\[([^\s/]+)(.+)?](\s+as\s+([a-zA-Z]+))?$/);

        let pkg;
        if (/^packages\/([^/]+).+/.test(path.relative(__dirname, currentDirectory))) {
          pkg = packages.find((p) => {
            const currentPkg = path.relative(__dirname, currentDirectory).match(/^packages\/([^/]+).+/)[1];
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

          if (/\.less$/.test(pkg.main)) {
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

        return less.FileManager.prototype.loadFileSync.call(this, p, '', options, environment);
      }

      tryAppendExtension(p) {
        return p;
      }

      tryAppendLessExtension(p) {
        return p;
      }
    }

    pluginManager.addFileManager(new Importer());
  },
};
