'use strict';

const superagent = require('superagent');
const userAgent = require('../../misc/userAgent');
const log = require('npmlog');

module.exports = function* fn(packages, pkg) {
  let info;
  try {
    if (global.offline) throw new Error('offline');
    info = JSON.parse((yield superagent.get(`https://gitlab.com/api/v3/projects/${pkg.source.owner}%2F${pkg.source.repo}/repository/blobs/${pkg.source.ref}?filepath=diamond.json`).set(userAgent.superagent)).text);
    info._type = 'diamond'; // eslint-disable-line
  } catch (error) {
    if (error.status === 404) {
      try {
        info = JSON.parse((yield superagent.get(`https://gitlab.com/api/v3/projects/${pkg.source.owner}%2F${pkg.source.repo}/repository/blobs/${pkg.source.ref}?filepath=package.json`).set(userAgent.superagent)).text);
      } catch (err) {
        if (err.status !== 404) {
          log.disableProgress();
          log.resume();
          if (err.status) log.error(`error downloading package.json: ${err.status}`, pkg.name);
          else throw err;
          log.error('not ok');
          process.exit(1);
        }
      }
    } else {
      log.disableProgress();
      log.resume();
      if (error.status) log.error(`error downloading diamond.json: ${error.status}`, pkg.name);
      else throw error;
      log.error('not ok');
      process.exit(1);
    }
  }

  return [info, `https://gitlab.com/api/v4/projects/${pkg.source.owner}%2F${pkg.source.repo}/repository/archive?sha=${pkg.source.ref}`];
};
