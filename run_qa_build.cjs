const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[QA Build Verification] Starting...');

const resultsDir = path.join(__dirname, 'QA_RESULTS');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

const buildLogFile = path.join(resultsDir, 'build_verification.log');
let output = '';
let success = false;
let duration = 0;

try {
  const start = Date.now();
  // Using vite build
  console.log('Running: npm run build');
  const stdout = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
  duration = Date.now() - start;
  success = true;
  output = `--- BUILD SUCCESS ---\nDuration: ${duration}ms\n\nSTDOUT:\n${stdout}`;
  console.log('Build succeeded!');
} catch (error) {
  success = false;
  output = `--- BUILD FAILED ---\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}`;
  console.error('Build failed!');
}

fs.writeFileSync(buildLogFile, output);

const summaryFile = path.join(resultsDir, 'build_summary.json');
fs.writeFileSync(summaryFile, JSON.stringify({ success, duration, timestamp: new Date().toISOString() }, null, 2));

console.log('[QA Build Verification] Finished. Logs saved to QA_RESULTS/build_verification.log');

// Create zip mockup script logic (without jszip)
// In a real environment, we would use JSZip or archiver.
try {
  // PowerShell Compress-Archive
  console.log('Packaging QA_RESULTS.zip...');
  const zipPath = path.join(__dirname, 'QA_RESULTS.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  execSync(`powershell -Command "Compress-Archive -Path '${resultsDir}\\*' -DestinationPath '${zipPath}' -Force"`);
  console.log('QA_RESULTS.zip generated successfully!');
} catch (err) {
  console.error('Failed to create ZIP archive:', err.message);
}
