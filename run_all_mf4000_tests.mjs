import { execSync } from 'child_process';

console.log(`================================================================`);
console.log(`RUNNING ALL MF-4000 INTEGRATION & MIGRATION SUITE TESTS`);
console.log(`================================================================\n`);

const testFiles = [
  'test_mf4000_geometry_parity.mjs',
  'test_mf4000_fft_parity.mjs',
  'test_mf4000_pipeline_parity.mjs',
  'test_production_pipeline_export.mjs'
];

let passedCount = 0;
for (const file of testFiles) {
  try {
    console.log(`Running ${file}...`);
    execSync(`node ${file}`, { stdio: 'inherit' });
    console.log(`🟢 ${file} PASSED\n`);
    passedCount++;
  } catch (err) {
    console.error(`🔴 ${file} FAILED: ${err.message}\n`);
  }
}

console.log(`================================================================`);
console.log(`SUITE TEST SUMMARY: ${passedCount} / ${testFiles.length} PASSED`);
console.log(`================================================================\n`);
