import fs from 'fs/promises';
import kleur from 'kleur';
import { fileURLToPath } from 'url';
import { Server } from '../src/server.mjs';

const devCdn = "https://jspm.dev/";

const cdn = process.env.TEST_CDN ?? true;
const dev = process.env.TEST_DEV ?? true;
const sys = process.env.TEST_SYSTEM ?? false; // TODO: not supported yet
const full = process.env.TEST_FULL ?? false;

let testSpecs;
if (full) {
  const testPath = fileURLToPath(new URL('../data/test-list.json', import.meta.url));
  testSpecs = JSON.parse(await fs.readFile(testPath, { encoding: 'utf8' }));
} else {
  const testPath = fileURLToPath(new URL('../data/tests.js', import.meta.url));
  testSpecs = eval(await fs.readFile(testPath, { encoding: "utf8" }));
}
const tests = await Promise.all(testSpecs.map(loadTest));

let toRun = [];
if (cdn) {
  toRun = toRun.concat(tests);
}
if (dev) {
  toRun = toRun.concat(tests.map(test => ({
    imports: test.imports.map(imp => devCdn + imp),
  })));
}
if (sys) {
  // TODO: support systemJS
}

const srv = new Server(
  8080,
  new URL('../', import.meta.url),
);
try {
  await srv.runTests(toRun);
  console.log(kleur.green('All tests passed successfully.'));
} catch (err) {
  console.log(kleur.red('Tests failed with message: '), err.message);
  process.exit(1);
} finally {
  await srv.end();
}

// see: data/tests.js
async function loadTest(specObj) {
  // TODO: support test functions, see @babel/core entry in tests.js
  let spec = specObj;
  if (Array.isArray(specObj)) {
    spec = specObj[0];
  }

  // see: scripts/generate-maps.mjs
  const specFile = encodeURIComponent(spec) + '.json';

  return {
    imports: spec.split(' '),
    map: JSON.parse(await fs.readFile(`./data/maps/${specFile}`)),
  };
}

// TODO: support systemJS:
// const cdnUrl = "https://ga.jspm.io/";
// const systemCdnUrl = "https://ga.system.jspm.io/";
// function systemReplace(map) {
//   for (const name of Object.keys(map.imports)) {
//     map.imports[name] = systemCdnUrl + map.imports[name].slice(cdnUrl.length);
//   }
//   if (map.scopes)
//     for (const scope of Object.keys(map.scopes)) {
//       const imports = map.scopes[scope];
//       delete map.scopes[scope];
//       map.scopes[systemCdnUrl + scope.slice(cdnUrl.length)] = imports;
//       for (const name of Object.keys(imports)) {
//         imports[name] = systemCdnUrl + imports[name].slice(cdnUrl.length);
//       }
//     }
//   return map;
// }
