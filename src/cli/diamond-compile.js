'use strict';

const program = require('commander');
const log = require('npmlog');
const fs = require('fs-extra');
const lockfile = require('proper-lockfile');
const compile = require('../functions/compile');

program
  .option('-o, --output <file>', 'the file to write to')
  .option('--output-style <nested|expanded|compact|compressed>', 'CSS output style', 'nested')
  .parse(process.argv);

log.heading = 'dia';

if (!program.args[0]) {
  log.error('you must provide a file to compile');
  log.error('not ok');
  process.exit(1);
}

lockfile.lockSync('./diamond/.internal/packages.lock');

compile(program.args[0], { outputStyle: program.outputStyle }).then((css) => {
  if (program.output) {
    fs.writeFileSync(program.output, css);
    process.exit(0);
  } else {
    process.stdout.write(css);
    process.exit(0);
  }
});
