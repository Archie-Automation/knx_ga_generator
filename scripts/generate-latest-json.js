/**
 * Generates latest.json for Tauri updater.
 * Run after `tauri build`. Output: src-tauri/target/release/bundle/latest.json
 *
 * Upload this file to your GitHub release as "latest.json" so the updater can find it.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const version = pkg.version;
const repo = "Archie-Automation/knx_ga_generator";
const baseUrl = `https://github.com/${repo}/releases/latest/download`;

const bundleDir = path.join(__dirname, "..", "src-tauri", "target", "release", "bundle");
const nsisDir = path.join(bundleDir, "nsis");
const msiDir = path.join(bundleDir, "msi");

const platforms = {};

/** Extract version from filename like "Product_0.1.4_x64-setup.exe" */
function extractVersion(filename) {
  const m = filename.match(/_([\d.]+)_x64/);
  return m ? m[1] : null;
}

/** Find .exe in dir that matches targetVersion and has a .sig file. Prefer exact version match. */
function findNsisExe(dir, targetVersion) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const candidates = files.filter((f) => f.endsWith("_x64-setup.exe"));
  for (const exe of candidates) {
    const sigPath = path.join(dir, `${exe}.sig`);
    if (!fs.existsSync(sigPath)) continue;
    if (extractVersion(exe) === targetVersion) return exe;
  }
  // Fallback: first candidate with sig (e.g. if version format changed)
  for (const exe of candidates) {
    const sigPath = path.join(dir, `${exe}.sig`);
    if (fs.existsSync(sigPath)) return exe;
  }
  return null;
}

/** Find .msi in dir that matches targetVersion and has a .sig file. Prefer exact version match. */
function findMsiFile(dir, targetVersion) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const candidates = files.filter((f) => f.endsWith("_x64_en-US.msi"));
  for (const msi of candidates) {
    const sigPath = path.join(dir, `${msi}.sig`);
    if (!fs.existsSync(sigPath)) continue;
    if (extractVersion(msi) === targetVersion) return msi;
  }
  for (const msi of candidates) {
    const sigPath = path.join(dir, `${msi}.sig`);
    if (fs.existsSync(sigPath)) return msi;
  }
  return null;
}

// NSIS (setup.exe) - primary for Windows
const nsisExe = findNsisExe(nsisDir, version);
if (nsisExe) {
  const sigPath = path.join(nsisDir, `${nsisExe}.sig`);
  const signature = fs.readFileSync(sigPath, "utf8").trim();
  // GitHub release assets use dots instead of spaces (e.g. KNX.GA.Generator not KNX GA Generator)
  const exeForUrl = nsisExe.replace(/ /g, ".");
  platforms["windows-x86_64"] = {
    url: `${baseUrl}/${encodeURIComponent(exeForUrl)}`,
    signature,
  };
}

// MSI - alternative for Windows (if NSIS not found, use MSI)
if (Object.keys(platforms).length === 0) {
  const msiFile = findMsiFile(msiDir, version);
  if (msiFile) {
    const sigPath = path.join(msiDir, `${msiFile}.sig`);
    const signature = fs.readFileSync(sigPath, "utf8").trim();
    const msiForUrl = msiFile.replace(/ /g, ".");
    platforms["windows-x86_64"] = {
      url: `${baseUrl}/${encodeURIComponent(msiForUrl)}`,
      signature,
    };
  }
}

if (Object.keys(platforms).length === 0) {
  console.error("[generate-latest-json] No build artifacts found. Run 'npm run tauri build' first.");
  process.exit(1);
}

const latest = {
  version,
  notes: "",
  pub_date: new Date().toISOString(),
  platforms,
};

// Warn if build artifact version doesn't match package.json (stale build cache)
const winExe = platforms["windows-x86_64"]?.url?.match(/_([\d.]+)_x64/)?.[1];
if (winExe && winExe !== version) {
  console.warn(`[generate-latest-json] WARNING: Build artifact has version ${winExe} but package.json has ${version}. Run "tauri build" again (or clean first) to fix.`);
}

const outPath = path.join(bundleDir, "latest.json");
fs.writeFileSync(outPath, JSON.stringify(latest, null, 2) + "\n");
const winUrl = platforms["windows-x86_64"]?.url;
console.log(`[generate-latest-json] Created ${outPath}`);
console.log(`[generate-latest-json] Windows URL: ${winUrl || "(none)"}`);
console.log(`[generate-latest-json] Upload latest.json + installer to your GitHub release.`);
