'use strict';

const superagent = require('superagent');
const userAgent = require('../../misc/userAgent');
const log = require('npmlog');

module.exports = function* fn(packages, pkg) {
  let info;
  try {
    if (global.offline) throw new Error('offline');
    info = JSON.parse((yield superagent.get(`https://raw.githubusercontent.com/${pkg.source.owner}/${pkg.source.repo}/${pkg.source.ref}/diamond.json`).set(userAgent.superagent)).text);
    info._type = 'diamond'; // eslint-disable-line
  } catch (error) {
    if (error.status === 404) {
      try {
        info = JSON.parse((yield superagent.get(`https://raw.githubusercontent.com/${pkg.source.owner}/${pkg.source.repo}/${pkg.source.ref}/package.json`).set(userAgent.superagent)).text);
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

  return [info, `https://github.com/${pkg.source.owner}/${pkg.source.repo}/archive/${pkg.source.ref}.tar.gz`];
};
