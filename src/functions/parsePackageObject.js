'use strict';

const semver = require('semver');
const npmValidate = require('validate-npm-package-name');
const log = require('npmlog');

module.exports = (dependencies) => {
  const deps = [];

  for (const dep in dependencies) {
    if (/^(gitlab:|gl:)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i.test(dependencies[dep])) {
      const match = dependencies[dep].match(/^(gitlab:|gl:)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i);
      deps.push({
        type: 'gitlab',
        owner: match[2],
        repo: match[3],
        name: dep,
        ref: match[6] || 'master',
      });
    } else if (/^(bitbucket:|bb:)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i.test(dependencies[dep])) {
      const match = dependencies[dep].match(/^(bitbucket:|bb:)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i);
      deps.push({
        type: 'bitbucket',
        owner: match[2],
        repo: match[3],
        name: dep,
        ref: match[6] || 'master',
      });
    } else if (/^(github:|gh:|)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i.test(dependencies[dep])) {
      const match = dependencies[dep].match(/^(github:|gh:|)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i);
      deps.push({
        type: 'github',
        owner: match[2],
        repo: match[3],
        name: dep,
        ref: match[6] || 'master',
      });
    } else if (/^npm:([^/@]+?)(@([^/]+))?$/i.test(dependencies[dep]) && npmValidate(
      dependencies[dep].match(/^npm:([^/@]+?)(@([^/]+))?$/i)[1]).validForOldPackages) {
      const match = dependencies[dep].match(/^npm:([^/@]+?)(@([^/]+))?$/i);
      if (semver.validRange(match[3])) {
        deps.push({
          type: 'npm',
          name: match[1],
          version: match[3],
        });
      } else {
        deps.push({
          type: 'npm',
          name: match[1],
          tag: match[3] || 'latest',
        });
      }
    } else if (npmValidate(dep).validForOldPackages && semver.validRange(dependencies[dep])) {
      deps.push({
        type: 'diamond',
        name: dep,
        version: dependencies[dep],
      });
    } else if (npmValidate(dep).validForOldPackages) {
      deps.push({
        type: 'diamond',
        name: dep,
        tag: dependencies[dep] || 'latest',
      });
    } else {
      log.disableProgress();
      log.resume();
      log.error('invalid package', `${dep}: ${dependencies[dep]}`);
      log.error('not ok');
      process.exit(1);
    }
  }

  return deps;
};
