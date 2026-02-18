/**
 * Starts Vite dev server (detached) and waits until http://localhost:5173 is reachable.
 * Exits 0 so Tauri (with wait: true) opens the window only after the server is ready.
 */
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const PORT = 5173;
const MAX_WAIT_MS = 60000;
const POLL_INTERVAL_MS = 300;

function waitForServer() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryReq = () => {
      const req = http.get(`http://127.0.0.1:${PORT}`, () => {
        req.destroy();
        resolve();
      });
      req.on('error', () => {
        req.destroy();
        if (Date.now() - start > MAX_WAIT_MS) {
          reject(new Error(`Server did not become ready within ${MAX_WAIT_MS / 1000}s`));
          return;
        }
        setTimeout(tryReq, POLL_INTERVAL_MS);
      });
    };
    tryReq();
  });
}

const child = spawn('npm', ['run', 'dev'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  detached: true,
  cwd: rootDir,
});

child.stdout && createInterface({ input: child.stdout }).on('line', (l) => console.log(l));
child.stderr && createInterface({ input: child.stderr }).on('line', (l) => console.error(l));

child.on('error', (err) => {
  console.error('[dev-with-wait] Failed to start Vite:', err);
  process.exit(1);
});

child.unref();

waitForServer()
  .then(() => {
    console.log('[dev-with-wait] Server ready at http://localhost:' + PORT);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[dev-with-wait]', err.message);
    process.exit(1);
  });
