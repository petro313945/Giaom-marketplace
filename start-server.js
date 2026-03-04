import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if dist directory exists, if not, build first
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.log('📦 Building application...');
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const build = spawn(npmCmd, ['run', 'build'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  build.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Build failed!');
      process.exit(1);
    }
    console.log('✅ Build completed!');
    startServe();
  });
} else {
  startServe();
}

function startServe() {
  console.log('🚀 Starting serve...');
  
  // Use npx serve for cross-platform compatibility
  const isWindows = process.platform === 'win32';
  const npxCmd = isWindows ? 'npx.cmd' : 'npx';
  
  const serve = spawn(npxCmd, ['serve', '-s', 'dist', '-l', '3000'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  serve.on('error', (err) => {
    console.error('❌ Failed to start serve:', err);
    process.exit(1);
  });

  serve.on('close', (code) => {
    if (code !== 0) {
      console.log(`Serve process exited with code ${code}`);
    }
    process.exit(code);
  });
}
