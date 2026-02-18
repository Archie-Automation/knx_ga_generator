/**
 * Sync version from package.json to src-tauri/tauri.conf.json
 * Run before tauri build so the app version matches package.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, '..', 'package.json');
const tauriPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const tauri = JSON.parse(fs.readFileSync(tauriPath, 'utf8'));

if (tauri.version !== pkg.version) {
  tauri.version = pkg.version;
  fs.writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');
  console.log(`[sync-version] Updated tauri.conf.json to version ${pkg.version}`);
}
