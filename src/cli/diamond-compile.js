'use strict';

const path = require('path');
const childProcess = require('child_process');

const importArgs = ['--importer', path.join(__dirname, '../importer.js')];
const proc = childProcess.spawn('node-sass', importArgs.concat(process.argv.splice(2, Infinity)));

proc.stdout.pipe(process.stdout);
proc.stderr.pipe(process.stderr);
process.stdin.pipe(proc.stdin);

proc.on('exit', process.exit);
