'use strict';

const superagent = require('superagent');
const userAgent = require('../../misc/userAgent');
const log = require('npmlog');

module.exports = async (packages, pkg) => {
  let info;
  try {
    info = JSON.parse((await superagent.get(`https://gitlab.com/api/v3/projects/${pkg.source.owner}%2F${pkg.source.repo}/repository/blobs/${pkg.source.ref}?filepath=diamond.json`).set(userAgent.superagent)).text);
  } catch (error) {
    if (error.status === 404) {
      try {
        info = JSON.parse((await superagent.get(`https://gitlab.com/api/v3/projects/${pkg.source.owner}%2F${pkg.source.repo}/repository/blobs/${pkg.source.ref}?filepath=package.json`).set(userAgent.superagent)).text);
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
