/* eslint-env node, jest */

'use strict';

const fs = require('fs');
const childProcess = require('child_process');
const diamond = require('..');

const libraries = [
  {
    name: 'Sierra',
    folder: 'sierra',
    package: 'sierra',
    install: 'sierra@2.0.0',
  },
  {
    name: 'Sierra (npm)',
    folder: 'sierra-npm',
    package: 'sierra-library',
    install: 'npm:sierra-library@2.0.0',
  },
  {
    name: 'Sierra (GitHub)',
    folder: 'sierra-github',
    package: 'sierra',
    install: 'github:sierra-library/sierra#3c670118d7e0223f697f55c71623334e243e278d',
  },
];

for (const library of libraries) {
  for (const cache of [true, false]) {
    describe(`${library.name} (${cache ? 'Cache Enabled' : 'Cache Disabled'})`, () => {
      test('install', () => {
        const otherArgs = [];
        if (!cache) otherArgs.push('--no-cache');
        const result = childProcess.spawnSync('diamond', ['i', '--no-save', library.install].concat(otherArgs));
        if (result.status !== 0) {
          throw new Error(`STDOUT:\n${result.stdout}\n\n-----\n\nSTDERR:\n${result.stderr}`);
        }
      });

      describe('CLI', () => {
        for (const lang of ['sass', 'less', 'styl']) {
          test(lang, () => {
            const result = childProcess.spawnSync('diamond', ['c', `test/${library.folder}/test.${lang}`]);
            if (result.status !== 0) {
              throw new Error(`STDOUT:\n${result.stdout}\n\n-----\n\nSTDERR:\n${result.stderr}`);
            } else {
              expect(result.stdout.toString()).toBe(fs.readFileSync(`test/${library.folder}/test.${lang}.css`, 'utf8'));
            }
          });
        }
      });

      describe('Node.JS API', () => {
        for (const lang of ['sass', 'less', 'styl']) {
          test(lang, () => {
            expect.assertions(1);
            return diamond.compile(`test/${library.folder}/test.${lang}`)
              .then((css) => {
                expect(css).toBe(fs.readFileSync(`test/${library.folder}/test.${lang}.css`, 'utf8'));
              });
          });
        }
      });
    });
  }
}
