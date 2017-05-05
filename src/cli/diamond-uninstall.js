'use strict';

const fs = require('fs-extra');
const log = require('npmlog');
const path = require('path');
const program = require('commander');
const lockfile = require('proper-lockfile');
const version = require('../../package.json').version;

program
  .version(version)
  .parse(process.argv);

const pkgs = program.args;

log.heading = 'dia';

fs.ensureDirSync('./diamond/packages');
fs.ensureFileSync('./diamond/.internal/packages.lock');

if (!fs.existsSync('./diamond/index.js')) fs.copySync(path.join(__dirname, '../importers/sass.js'), './diamond/index.js');

const release = lockfile.lockSync('./diamond/.internal/packages.lock');

let packages;
try {
  packages = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
} catch (err) {
  process.exit(0);
}

for (const name of pkgs) {
  let index = 0;
  const pkg = packages.find((p, i) => {
    index = i;
    return p.name.toLowerCase() === name.toLowerCase() && !p.for;
  });
  if (!pkg) continue;
  fs.removeSync(path.join(process.cwd(), 'diamond', 'packages', pkg.path));
  packages.splice(index, 1);

  for (const i in packages) {
    const dep = packages[i];
    if (dep.for.toLowerCase() !== name.toLowerCase()) continue;
    fs.removeSync(path.join(process.cwd(), 'diamond', 'packages', dep.path));
    packages.splice(i, 1);
  }
}

fs.writeFileSync('./diamond/.internal/packages.lock', JSON.stringify(packages));

release();
