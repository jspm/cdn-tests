import { readFileSync, existsSync, writeFileSync } from 'fs';
import { Generator } from '@jspm/generator';
import { fileURLToPath } from 'url';

const regenerate = false;

const testList = eval(readFileSync(new URL('../data/tests.js', import.meta.url)).toString());
const tests = [...testList.map(test => Array.isArray(test) ? test[0] : test), ...eval(readFileSync(new URL('../data/test-list.json', import.meta.url)).toString())];
const skip = eval(readFileSync(new URL('../data/skip-list.js', import.meta.url)).toString());
let failures = 0;
let successes = 0;
let count = tests.length;
for (const [index, test] of tests.entries()) {
  if (skip.includes(test)) {
    count--;
    continue;
  }
  const [installs] = typeof test === 'string' ? [test, test] : test;
  const path = fileURLToPath(import.meta.url + '/../../data/maps/') + encodeURIComponent(installs) + '.json';
  if (!regenerate && existsSync(path))
    continue;
  console.log('Generating map for ' + test + ' (' + (index + 1) + ' / ' + count + ' | ' + successes + ' / ' + failures + ')');
  const generator = new Generator();
  try {
    await generator.install(installs.split(' '));
    successes++;
  }
  catch (e) {
    failures++;
    console.error(e);
    continue;
  }
  writeFileSync(path, JSON.stringify(generator.getMap(), null, 2));
}
