import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist, skipping...`);
    return;
  }
  
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      removeDir(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  });
  
  fs.rmdirSync(dir);
  console.log(`Removed directory: ${dir}`);
}

// Remove dist folder
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  console.log('Cleaning dist folder...');
  removeDir(distPath);
  console.log('✓ Dist folder cleared');
} else {
  console.log('✓ Dist folder does not exist');
}

// Clear node_modules/.vite cache if it exists
const viteCachePath = path.join(__dirname, '..', 'node_modules', '.vite');
if (fs.existsSync(viteCachePath)) {
  console.log('Cleaning Vite cache...');
  removeDir(viteCachePath);
  console.log('✓ Vite cache cleared');
} else {
  console.log('✓ Vite cache does not exist');
}

// Remove Tauri bundle output (installers) – forces fresh icon embedding
const bundlePath = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle');
if (fs.existsSync(bundlePath)) {
  console.log('Cleaning Tauri bundle (installers)...');
  removeDir(bundlePath);
  console.log('✓ Bundle folder cleared');
} else {
  console.log('✓ Bundle folder does not exist');
}

console.log('\n✓ Clean completed!');

