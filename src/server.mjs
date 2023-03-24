import { spawn } from 'child_process';
import EventEmitter, { once } from 'events';
import fs from 'fs';
import http from 'http';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';

export class Server extends EventEmitter {
  id = 0
  mimes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.wasm': 'application/wasm'
  }

  constructor(port = 8080, rootUrl = import.meta.url) {
    super();
    this.port = port;
    this.rootUrl = rootUrl;
    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url, this.rootUrl);

      // For debugging CI:
      if (process.env.CI_BROWSER)
        console.log('Received request: ' + url);

      // Called by a test when it succeeds:
      if (req.url.startsWith('/done?')) {
        const id = url.searchParams.get('id');
        const msg = url.searchParams.get('msg');
        if (id) this.emit('done', id, msg);
        return;
      }

      // Called by a test when it fails:
      else if (req.url.startsWith('/error?')) {
        const id = url.searchParams.get('id');
        const msg = url.searchParams.get('msg');
        if (id) this.emit('error', id, msg);
        return;
      }

      // Fallback to serving local files:
      await this.handleFile(req, res);
    }).listen(this.port);

    console.log(`CDN test server listening on http://localhost:${this.port}`);
  }

  async end() {
    return new Promise((resolve, reject) => server.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }));
  }

  async runTests(tests) {
    let onDone, onError, child, timeout;
    try {
      const id = this.id++;
      const testUrl = `http://localhost:${this.port}/src/test-harness.html?id=${id}`;

      // Set-up handlers for test completion:
      const testCompletion = new Promise((resolve, reject) => {
        onDone = (id, msg) => {
          console.log(`test#${id} succeeded: ${msg}`);
          resolve();
        };
        this.on('done', onDone);

        onError = (id, msg) => {
          console.log(`test#${id} failed: ${msg}`);
          reject(new Error(`test#${id} failed with message: ${msg}`));
        };
        this.on('error', onError);

        setTimeout(() => reject(new Error(`test#${id} timed out`)), 60000);
      });

      // Spawn a browser serving the test runner:
      if (process.env.CI_BROWSER) {
        const args = process.env.CI_BROWSER_FLAGS ?
          process.env.CI_BROWSER_FLAGS.split(' ') :
          [];

        console.log(`Spawning browser process for test#${id}.`);
        child = spawn(process.env.CI_BROWSER, [...args, testUrl]);
      } else {
        open(testUrl, { app: { name: open.apps.chrome } });
      }

      await testCompletion;
    }

    // Clean up everything from the test:
    finally {
      if (onDone) this.off('done', onDone);
      if (onError) this.off('error', onError);
      if (child) child.kill('SIGKILL');
      if (timeout) clearTimeout(timeout);
    }
  }

  async handleFile(req, res) {
    const url = new URL(req.url[0] === '/' ? req.url.slice(1) : req.url, this.rootUrl);
    const filePath = fileURLToPath(url);

    const fileStream = fs.createReadStream(filePath);
    try {
      await once(fileStream, 'readable');
    }
    catch (e) {
      if (e.code === 'EISDIR' || e.code === 'ENOENT') {
        res.writeHead(404, {
          'content-type': 'text/html'
        });
        res.end(`File not found.`);
      }
      return;
    }

    let mime;
    if (filePath.endsWith('javascript.css'))
      mime = 'application/javascript';
    else if (filePath.endsWith('content-type-xml.json'))
      mime = 'application/xml';
    else
      mime = this.mimes[path.extname(filePath)] || 'text/plain';

    const headers = filePath.endsWith('content-type-none.json') ?
      {} : { 'content-type': mime, 'Cache-Control': 'no-cache' }

    res.writeHead(200, headers);
    fileStream.pipe(res);
    await once(fileStream, 'end');
    res.end();
  }
}