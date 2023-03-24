import { Server } from "./src/server.mjs";

const srv = new Server(8080, import.meta.url);
await srv.runTests([]);
