'use strict';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const log = require('npmlog');
const config = require('../functions/loadConfig');
const superagent = require('superagent');
const ignore = require('ignore-file');
const tar = require('tar-fs');
const zlib = require('zlib');

log.heading = 'dia';

exports.command = 'publish';
exports.desc = 'Publishes the current directory';
exports.builder = {
  readme: {
    desc: 'The path to the readme to publish',
  },
};

exports.handler = (args) => {
  fs.ensureDirSync(path.join(os.homedir(), '.diamond'));
  if (!fs.existsSync(path.join(os.homedir(), '.diamond/auth.json'))) fs.writeFileSync(path.join(os.homedir(), '.diamond/auth.json'), JSON.stringify({}));
  const auth = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.diamond/auth.json')));

  if (!auth) {
    log.error('not logged in', 'please run \'diamond login\'');
    process.exit(1);
  }

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync('./diamond.json'));
  } catch (err) {
    log.error('no diamond.json found');
    process.exit(1);
  }

  if (!packageJson.name) {
    log.error('no \'name\' field');
    process.exit(1);
  } else if (!packageJson.version) {
    log.error('no \'version\' field');
    process.exit(1);
  } else if (!packageJson.description) {
    log.error('no \'description\' field');
    process.exit(1);
  } else if (!packageJson.main) {
    log.warn('no \'main\' field');
  }

  let readme;
  if (args.readme) {
    if (!fs.existsSync(path.join(process.cwd(), args.readme))) {
      log.error('invalid readme', args.readme);
      process.exit(1);
    }

    readme = fs.readFileSync(path.join(process.cwd(), args.readme)).toString();
  } else if (fs.existsSync(path.join(process.cwd(), 'README.md'))) {
    readme = fs.readFileSync(path.join(process.cwd(), 'README.md')).toString();
  } else if (fs.existsSync(path.join(process.cwd(), 'readme.md'))) {
    readme = fs.readFileSync(path.join(process.cwd(), 'readme.md')).toString();
  } else {
    log.warn('no readme');
  }

  const filter = ignore.sync('.diaignore') || ignore.sync('.gitignore') || ignore.compile('');
  const internalFilter = ignore.compile('node_modules\ndiamond\n.git');

  const stream = tar.pack('.', {
    ignore: name => filter(name) || internalFilter(name),
  }).pipe(zlib.createGzip());

  let file = Buffer.alloc(0);
  stream.on('data', (data) => {
    file = Buffer.concat([file, data]);
  });

  stream.on('end', () => {
    superagent.post(`${config.registry}/package/${packageJson.name}`)
      .auth(auth.username, auth.password)
      .field('package', JSON.stringify(packageJson))
      .field('readme', readme || '')
      .attach('dist', file, 'dist.tar.gz')
      .then((res) => {
        process.stdout.write(`+ ${res.body.tags.latest}\n`);
      })
      .catch((res) => {
        log.http(res.status, res.response.body.message);
        process.exit(1);
      });
  });
};
