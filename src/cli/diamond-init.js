'use strict';

const fs = require('fs-extra');
const path = require('path');
const prompt = require('prompt');

exports.command = 'init';
exports.desc = 'setup a diamond.json file';
exports.builder = {};

exports.handler = () => {
  let info = {};
  if (fs.existsSync(path.join(process.cwd(), 'diamond.json'))) info = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'diamond.json')));

  prompt.start();

  prompt.get([
    { name: 'name', default: info.name || path.parse(process.cwd()).name },
    { name: 'version', default: info.version || '1.0.0' },
    { name: 'description', default: info.description || '' },
    { name: 'main', description: 'main file', default: info.main || 'index.sass' },
  ], (err, result) => {
    if (err) throw err;
    fs.writeFileSync(path.join(process.cwd(), 'diamond.json'), JSON.stringify(Object.assign(info, result), null, 2));
  });
};
