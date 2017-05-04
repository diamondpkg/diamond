'use strict';

const log = require('npmlog');
const path = require('path');
const fs = require('fs-extra');
const lockfile = require('proper-lockfile');

log.heading = 'dia';

module.exports = (file, current) => {
  if (/^~([^\s/]+)(((?!\s+as\s+).)*)(\s+as\s+['"]?([a-zA-Z]+)['"]?)?$/.test(file)) {
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
      return new Error('no packages installed');
    }

    const match = file.match(/^~([^\s/]+)(((?!\s+as\s+).)*)(\s+as\s+['"]?([a-zA-Z]+)['"]?)?$/);

    let pkg;
    if (/^packages\/([^/]+).+/.test(path.relative(__dirname, current))) {
      pkg = packages.find((p) => {
        const currentPkg = path.relative(__dirname, current).match(/^packages\/([^/]+).+/)[1];
        return p.path === `${currentPkg}/diamond/packages/${match[1]}`;
      }) || packages.find(p => p.path === match[1]);
    } else {
      pkg = packages.find(p => p.path === match[1]);
    }

    if (!pkg) {
      release();
      return new Error(`could not find package '${match[1]}'`);
    }

    if (!global.compileCommand && !global.holdUp &&
      (pkg.functions || pkg.importer || pkg.postProcessor)) {
      global.holdUp = true;
      log.warn('hold up!', 'you are using packages that require features only found when using the compile command');
      log.warn('hold up!', 'use the compile command do avoid any issues');
    }

    let p;
    let contents;

    if (match[2]) {
      release();
      try {
        fs.accessSync(path.join(process.cwd(), 'diamond/packages', pkg.path, match[2]));
      } catch (err) {
        return new Error(`could not find file '${path.join(match[1], match[2])}'`);
      }

      p = path.join(process.cwd(), 'diamond/packages', pkg.path, match[2]);
    } else if (pkg.main) {
      release();
      try {
        fs.accessSync(path.join(process.cwd(), 'diamond/packages', pkg.path, pkg.main));
      } catch (err) {
        return new Error(`could not find file '${path.join(match[1], pkg.main)}' this is likely a problem with the package itself`);
      }

      if (/\.sass|\.scss$/.test(pkg.main)) {
        p = path.join(process.cwd(), 'diamond/packages', pkg.path, pkg.main);
      } else if (/\.css$/.test(pkg.main)) {
        contents = fs.readFileSync(path.join(process.cwd(), 'diamond/packages', pkg.path, pkg.main)).toString();
      } else {
        try {
          fs.accessSync(path.join(process.cwd(), 'diamond/packages', pkg.path, 'diamond/dist/main.css'));
        } catch (err) {
          return new Error('could not find dist files, try reinstalling');
        }

        contents = fs.readFileSync(path.join(process.cwd(), 'diamond/packages', pkg.path, 'diamond/dist/main.css')).toString();
      }
    } else {
      release();
      return new Error('the package has no mainfile! you need to import files from this package manually');
    }

    if (p) {
      if (/\.scss$/.test(pkg.main)) {
        contents = fs.readFileSync(p).toString();
        return { file: p, contents: `$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__: "${match[5] ? `${match[5]}-` : ''}";\n${contents}` };
      }

      return { contents: `$__${pkg.name.replace(/[!"#$%&'()*+,./:;<=>?@[\]^{|}~]/g, '')}__namespace__: "${match[5] ? `${match[5]}-` : ''}";\n@import "${p.replace(/\\/g, '/')}";` };
    }

    return { contents };
  }

  return null;
};
