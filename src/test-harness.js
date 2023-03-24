import runTests from "./runner.js";
import { createMapLoader } from "./loader.js";

// const cdnUrl = "https://ga.jspm.io/";
// const systemCdnUrl = "https://ga.system.jspm.io/";
// const devCdnUrl = "https://jspm.dev/";
// const dispose = window.location.hash.length > 0;

const id = new URL(window.location).searchParams.get('id');
if (!id) {
  throw new Error("expected to receive id parameter");
}

const tests = await (await fetch(`/data?id=${id}`)).json();
await runTests(
  tests.map(test => {
    return {
      test: test.imports,
      async run() {
        // TODO: support systemjs
        const loader = createMapLoader(test.map, false);
        await Promise.all(test.imports.map(loader.import));
        loader.dispose();
      }
    };
  })
);

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

// async function loadAndCreateMap(url, system) {
//   let map = await (await fetch(url)).json();
//   if (system) map = systemReplace(map);
//   return createMapLoader(map, system);
// }

//if (cdn) {
//  await runTests(
//    await Promise.all(
//      tests.map(async (test) => {
//        //const [installs, testFn] = typeof test === "string" ? [test] : test;
//        return {
//          test: installs,
//          async run() {
//            const loader = await loadAndCreateMap(
//              `../data/maps/${encodeURIComponent(encodeURIComponent(installs))}.json`
//            );
//            const ms = await Promise.all(
//              installs.split(" ").map(loader.import)
//            );
//            //if (typeof testFn === "function") testFn(...ms);
//            if (dispose) loader.dispose();
//          },
//        };
//      })
//    )
//  );
//}
//
//if (dev) {
//  await runTests(
//    await Promise.all(
//      tests.map(async (test, index) => {
//        const [installs, specifiers] =
//          typeof test === "string" ? [test, test] : test;
//        return {
//          test: installs,
//          async run() {
//            const loader = createMapLoader({});
//            const ms = await Promise.all(
//              installs
//                .split(" ")
//                .map((specifier) => devCdnUrl + specifier)
//                .map(loader.import)
//            );
//            if (typeof testFn === "function") testFn(...ms);
//            if (dispose) loader.dispose();
//          },
//        };
//      })
//    )
//  );
//}

// if (system) {
//   await runTests(
//     await Promise.all(
//       tests.map(async (test, index) => {
//         const [installs, specifiers] =
//           typeof test === "string" ? [test, test] : test;
//         return {
//           test: installs,
//           async run() {
//             const loader = await loadAndCreateMap(
//               `../data/maps/${encodeURIComponent(encodeURIComponent(installs))}.json`,
//               true
//             );
//             const ms = await Promise.all(
//               installs.split(" ").map(loader.import)
//             );
//             if (typeof testFn === "function") testFn(...ms);
//             if (dispose) loader.dispose();
//           },
//         };
//       })
//     )
//   );
// }

// if (full) {
//   const testList = await (await fetch("../data/test-list.json")).json();
//   const skip = eval(await (await fetch("../data/skip-list.js")).text());
//   const startAt = 0;
//   runTests(
//     await Promise.all(
//       testList
//         .filter((test, i) => !skip.includes(test) && i > +startAt)
//         .map(async (test, index) => {
//           return {
//             test,
//             async run() {
//               if (window.stopped) return;
//               if (dev) loader = createMapLoader({});
//               else {
//                 try {
//                   var loader = await loadAndCreateMap(
//                     `../data/maps/${encodeURIComponent(
//                       encodeURIComponent(test)
//                     )}.json`,
//                     system
//                   );
//                   // if (!map.imports[test])
//                   //   throw new Error('Test TODO: export subpaths checks');
//                 } catch (e) {
//                   throw new Error("No map for " + test);
//                   return;
//                 }
//               }
//               const m = await loader.import(
//                 (dev ? "https://jspm.dev/" : "") + test
//               );
//               window.m = m;
//               if (dispose) loader.dispose();
//             },
//           };
//         })
//     )
//   );
// }

fetch(`/done?id=${id}`);
