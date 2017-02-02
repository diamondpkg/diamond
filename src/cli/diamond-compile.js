'use strict';

const program = require('commander');
const sass = require('node-sass');
const log = require('npmlog');
const fs = require('fs-extra');
const lockfile = require('proper-lockfile');
const path = require('path');
const async = require('async');
const importer = require('../importer');

program
  .option('-o, --output <file>', 'the file to write to')
  .option('--output-style <nested|expanded|compact|compressed>', 'CSS output style', 'nested')
  .parse(process.argv);

log.heading = 'dia';
log.info('it worked if it ends with', 'ok');

if (!program.args[0]) {
  log.error('you must provide a file to compile');
  log.error('not ok');
  process.exit(1);
}

fs.ensureDirSync('./diamond/packages');
fs.ensureFileSync('./diamond/.internal/packages.lock');

const release = lockfile.lockSync('./diamond/.internal/packages.lock');

let packages;
try {
  packages = JSON.parse(fs.readFileSync('./diamond/.internal/packages.lock'));
} catch (err) {
  packages = [];
}

const functions = {};

packages.filter(o => !!o.functions)
  .forEach((o) => {
    for (const func in o.functions) { //eslint-disable-line
      functions[func] = require(path.join(process.cwd(), 'diamond/packages', o.path, o.functions[func]));
    }
  });

const importers = packages.filter(o => !!o.importer)
  .map(o => require(path.join(process.cwd(), 'diamond/packages', o.path, o.importer)));
const postCompiles = packages.filter(o => !!o.postCompile)
  .map(o => require(path.join(process.cwd(), 'diamond/packages', o.path, o.postCompile)));

release();

sass.render({
  file: program.args[0],
  outputStyle: program.outputStyle,
  importer: [importer, ...importers],
  functions,
}, (error, result) => {
  if (error) {
    log.error('sass', error.message);
    log.error('not ok');
    process.exit(1);
  }

  let css = result.css.toString();

  async.each(postCompiles, (postCompile, done) => {
    let res;
    try {
      res = postCompile(css);
    } catch (err) {
      if (typeof err === 'string') {
        log.error('post install', err);
        log.error('not ok');
        process.exit(1);
      } else {
        log.error('post install', err.message);
        log.error('not ok');
        process.exit(1);
      }
    }

    Promise.resolve(res).then((newCss) => {
      css = newCss;
      done();
    }).catch((err) => {
      if (typeof err === 'string') {
        log.error('post install', err);
        log.error('not ok');
        process.exit(1);
      } else {
        log.error('post install', err.message);
        log.error('not ok');
        process.exit(1);
      }
    });
  }, () => {
    if (program.output) {
      fs.writeFileSync(program.output, css);
      log.info('ok');
      process.exit(0);
    } else {
      console.log(css); //eslint-disable-line
      log.info('ok');
      process.exit(0);
    }
  });
});
