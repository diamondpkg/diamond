const diamondVersion = require('../../package.json').version;
const superagentVersion = require('superagent/package.json').version;

module.exports = {
  superagent: {
    'User-Agent': `diamond/v${diamondVersion} superagent/${superagentVersion} node/${process.version}`,
  },
};
