'use strict';

const superagent = require('superagent');
const userAgent = require('../../misc/userAgent');
const log = require('npmlog');

module.exports = (packages, pkg) => new Promise(resolve => {
  superagent.get(`https://raw.githubusercontent.com/${pkg.source.owner}/${pkg.source.repo}/${pkg.source.ref}/diamond.json`).set(userAgent.superagent).then(res => {
    let info;
    try {
      info = JSON.parse(res.text);
    } catch (err) {
      info = null;
    }

    resolve([info, `https://github.com/${pkg.source.owner}/${pkg.source.repo}/archive/${pkg.source.ref}.tar.gz`]);
  }).catch(res => {
    if (res.status === 404) {
      resolve([null, `https://github.com/${pkg.source.owner}/${pkg.source.repo}/archive/${pkg.source.ref}.tar.gz`]);
    } else {
      log.disableProgress();
      log.resume();
      log.error(`error downloading diamond.json: ${res.status}`, `${pkg.source.owner}/${pkg.source.repo}#${pkg.source.ref}`);
      log.error('not ok');
      process.exit(1);
    }
  });
});