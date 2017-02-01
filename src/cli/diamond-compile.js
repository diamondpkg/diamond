const program = require('commander');
const sass = require('node-sass');
const log = require('npmlog');
const fs = require('fs-extra');
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

sass.render({
  file: program.args[0],
  outputStyle: program.outputStyle,
  importer,
}, (error, result) => {
  if (error) {
    log.error('sass', error.message);
    log.error('not ok');
    process.exit(1);
  }

  if (program.output) {
    fs.writeFileSync(program.output, result.css.toString());
    log.info('ok');
    process.exit(0);
  } else {
    console.log(result.css.toString()); //eslint-disable-line
    log.info('ok');
    process.exit(0);
  }
});
