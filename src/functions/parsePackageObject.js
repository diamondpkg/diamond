'use strict';

const semver = require('semver');
const npmValidate = require('validate-npm-package-name');
const log = require('npmlog');

log.heading = 'dia';

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
    } else if (npmValidate(dep).validForOldPackages && semver.validRange(dependencies[dep])) {
      deps.push({
        type: 'npm',
        name: dep,
        version: dependencies[dep],
      });
    } else if (npmValidate(dep).validForOldPackages) {
      deps.push({
        type: 'npm',
        name: dep,
        tag: dependencies[dep] || 'latest',
      });
    } else {
      log.error('invalid package', `${dep}: ${dependencies[dep]}`);
      log.error('not ok');
      process.exit(1);
    }
  }

  return deps;
};
