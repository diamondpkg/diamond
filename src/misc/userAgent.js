const diamondVersion = require('../../package.json').version;
const superagentVersion = require('superagent/package.json').version;
const registryVersion = require('npm-registry-client/package.json').version;

module.exports = {
  superagent: {
    'User-Agent': `diamond/v${diamondVersion} superagent/${superagentVersion} node/${process.version}`,
  },
  registry: `diamond/v${diamondVersion} npm-registry-client/${registryVersion} node/${process.version}`,
};
