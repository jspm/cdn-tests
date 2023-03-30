import runTests from "./runner.js";
import { createMapLoader } from "./loader.js";

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

fetch(`/done?id=${id}`);
