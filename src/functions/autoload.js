'use strict';

const fs = require('fs-extra');
const path = require('path');
const lockfile = require('proper-lockfile');

module.exports = () => {
  const release = lockfile.lockSync('./diamond/.internal/packages.lock');
  let autoload = '';
  const installed = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
  for (const installedPkg of installed) {
    if (!installedPkg.for && fs.existsSync(path.join(process.cwd(), 'diamond/packages', installedPkg.path, 'diamond/dist/main.css'))) {
      autoload += `${fs.readFileSync(path.join(process.cwd(), 'diamond/packages', installedPkg.path, 'diamond/dist/main.css'))}\n\n`;
    } else if (!installedPkg.for && installedPkg.main.endsWith('.css')) {
      autoload += `${fs.readFileSync(path.join(process.cwd(), 'diamond/packages', installedPkg.path, installedPkg.main))}\n\n`;
    }
  }

  fs.writeFileSync('./diamond/autoload.css', autoload.trim());

  release();
};
