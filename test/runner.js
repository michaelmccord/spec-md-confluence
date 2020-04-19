const assert = require('assert');
const fs = require('fs');
const path = require('path');
const specMarkdown = require('spec-md');
const specMDConfluence = require('../');

const shouldRecord = process.env.RECORD ? Boolean(JSON.parse(process.env.RECORD.toLowerCase())) : false;

runTests([
  [path.resolve(path.dirname(require.resolve('spec-md')), '../README.md'), 'readme/output.xml'],
  //['simple-header/input.md', 'simple-header/output.xml'],
]);

async function runTests(tests) {
  try {
    for (let [input, expectedOutput] of tests) {
      await runTest(input, expectedOutput);
    }
  } catch (error) {
    if (error.code === 'ERR_ASSERTION') {
      process.stderr.write('\n' + error.message + '\n\n');
      if (!error.expected) {
        process.stderr.write('\nNo recorded output found to compare to.\n\n');
      } else {
        const jestDiff = require('jest-diff');
        process.stderr.write(
          jestDiff.default(error.actual, error.expected, { expand: false }) + '\n\n'
        );
      }
    } else {
      process.stderr.write('\n\n' + String(error && error.stack || error) + '\n\n');
    }

    if (error.code !== 'ERR_ASSERTION')
      throw error;

    process.exit(1);
  }
}

function runTest(input, expectedOutputPath) {
  const start = Date.now();
  process.stdout.write(`testing: ${input} ... `);
  return specMDConfluence([], specMarkdown.parse(path.resolve(__dirname, input)))
    .then(function(actualOutput){
      try {
        const expectedOutput = fs.readFileSync(path.resolve(__dirname, expectedOutputPath), 'utf8');
        assert.equal(
          expectedOutput,
          actualOutput,
          'Did not print expected HTML.\n\n' +
            'If confident the changes are correct, rerun with RECORD set:\n' +
            '  $ RECORD=1 yarn test\n\n\n'
        );
      } catch (error) {
        if (error.code === 'ERR_ASSERTION' && shouldRecord) {
          fs.writeFileSync(path.resolve(__dirname, expectedOutputPath), actualOutput);
        } else {
          throw error;
        }
      }

      process.stdout.write(`DONE (${Date.now() - start}ms) \n`);
    });
}
