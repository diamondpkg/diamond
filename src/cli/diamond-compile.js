'use strict';

const log = require('npmlog');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const compile = require('../functions/compile');

log.heading = 'dia';

exports.command = 'compile <file>';
exports.desc = 'compile a file';
exports.aliases = ['c'];
exports.builder = {
  output: {
    alias: 'o',
    desc: 'the file to write to',
  },
  watch: {
    alias: 'w',
    desc: 'compile files on changes',
    boolean: true,
  },
  'output-style': {
    desc: 'CSS output style',
    default: 'nested',
    choices: ['nested', 'expanded', 'compact', 'compressed'],
  },
  minify: {
    alias: 'm',
    desc: 'Minifies CSS',
    boolean: true,
  },
};

exports.handler = (args) => {
  if (args.watch && !args.output) {
    log.error('no output', 'you must provide an output when using \'--watch\'');
    log.error('not ok');
    process.exit(1);
  }

  if (args.watch) global.cli = false;

  compile(args.file, { outputStyle: args.outputStyle, minify: args.minify }).then((css) => {
    if (args.watch) {
      fs.writeFileSync(args.output, css);
      log.notice('compiled');
    } else if (args.output) {
      fs.writeFileSync(args.output, css);
      process.exit(0);
    } else {
      process.stdout.write(css);
      process.exit(0);
    }
  })
  .catch((err) => {
    log.error('compile', err.message);
    log.error('compile', err.stack);
  });

  if (args.watch) {
    chokidar.watch('.', {
      awaitWriteFinish: true,
      ignoreInitial: true,
      ignored: [
        args.output,
        '.git',
      ],
    }).on('all', () => {
      compile(args.file, { outputStyle: args.outputStyle })
        .then((css) => {
          fs.writeFileSync(args.output, css);
          log.notice('compiled');
        })
        .catch((err) => {
          log.error('compile', err.message);
          log.error('compile', err.stack);
        });
    });
  }
};
