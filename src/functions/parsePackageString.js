'use strict';

const semver = require('semver');
const npmValidate = require('validate-npm-package-name');

module.exports = (pkg) => {
  if (/^(gitlab:|gl:)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i.test(pkg)) {
    const match = pkg.match(/^(gitlab:|gl:)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i);
    return {
      type: 'gitlab',
      owner: match[2].toLowerCase(),
      repo: match[3].toLowerCase(),
      ref: match[6] || 'master',
    };
  } else if (/^(bitbucket:|bb:)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i.test(pkg)) {
    const match = pkg.match(/^(bitbucket:|bb:)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i);
    return {
      type: 'bitbucket',
      owner: match[2].toLowerCase(),
      repo: match[3].toLowerCase(),
      ref: match[6] || 'master',
    };
  } else if (/^(github:|gh:|)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i.test(pkg)) {
    const match = pkg.match(/^(github:|gh:|)([^#@\s]+)\/([^#@\s]+)((#|@)(.+))?$/i);
    return {
      type: 'github',
      owner: match[2].toLowerCase(),
      repo: match[3].toLowerCase(),
      ref: match[6] || 'master',
    };
  } else if (/^([^/@]+?)(@([^/]+))?$/i.test(pkg) && npmValidate(
    pkg.match(/^([^/@]+?)(@([^/]+))?$/i)[1]).validForOldPackages) {
    const match = pkg.match(/^([^/@]+?)(@([^/]+))?$/i);
    if (semver.validRange(match[3])) {
      return {
        type: 'npm',
        name: match[1].toLowerCase(),
        version: match[3],
      };
    }
    return {
      type: 'npm',
      name: match[1].toLowerCase(),
      tag: match[3] || 'latest',
    };
  }

  return null;
};
