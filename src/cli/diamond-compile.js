'use strict';

const log = require('npmlog');
const fs = require('fs-extra');
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
  'output-style': {
    desc: 'CSS output style',
    default: 'nested',
    choices: ['nested', 'expanded', 'compact', 'compressed'],
  },
};

exports.handler = (args) => {
  compile(args.file, { outputStyle: args.outputStyle }).then((css) => {
    if (args.output) {
      fs.writeFileSync(args.output, css);
      process.exit(0);
    } else {
      process.stdout.write(css);
      process.exit(0);
    }
  });
};
