import { Server } from "./src/server.mjs";
import fs from "fs/promises";
import kleur from "kleur";

const srv = new Server(8080, import.meta.url);
try {
  await srv.runTests([
    await loadTest('@babel/core'),
  ]);
  console.log(kleur.green("All tests passed successfully."));
} catch (err) {
  console.log(kleur.red("Tests failed with message: "), err.message);
  process.exit(1);
} finally {
  console.log("Killing server...");
  await srv.end();
  console.log("Bye.");
}

// see: data/tests.js
async function loadTest(spec) {
  // see: scripts/generate-maps.mjs
  const specFile = encodeURIComponent(spec) + ".json";

  return {
    imports: spec.split(" "),
    map: JSON.parse(await fs.readFile(`./data/maps/${specFile}`)),
  };
}
