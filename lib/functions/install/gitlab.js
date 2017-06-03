'use strict';

const superagent = require('superagent');
const userAgent = require('../../misc/userAgent');
const log = require('npmlog');

module.exports = (packages, pkg) => new Promise(resolve => {
  superagent.get(`https://gitlab.com/api/v3/projects/${pkg.source.owner}%2F${pkg.source.repo}/repository/blobs/${pkg.source.ref}?filepath=diamond.json`).set(userAgent.superagent).then(res => {
    let info;
    try {
      info = JSON.parse(res.text);
    } catch (err) {
      info = null;
    }

    resolve([info, `https://gitlab.com/api/v4/projects/${pkg.source.owner}%2F${pkg.source.repo}/repository/archive?sha=${pkg.source.ref}`]);
  }).catch(res => {
    if (res.status === 404) {
      resolve([null, `https://gitlab.com/api/v4/projects/${pkg.source.owner}%2F${pkg.source.repo}/repository/archive?sha=${pkg.source.ref}`]);
    } else {
      log.disableProgress();
      log.resume();
      log.error(`error downloading diamond.json: ${res.status}`, `${pkg.source.owner}/${pkg.source.repo}#${pkg.source.ref}`);
      log.error('not ok');
      process.exit(1);
    }
  });
});