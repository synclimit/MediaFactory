import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function scanAndTestPlugins() {
  console.log('================================================================');
  console.log('MF-4000 Phase 4 — AUTOMATED VISUALIZER PLUGIN INVENTORY & SUITE TEST');
  console.log('================================================================');

  const categoriesDir = path.join(process.cwd(), 'src', 'visualizers', 'categories');
  const inventory = [];

  function scanDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'index.js') {
        inventory.push(fullPath);
      }
    }
  }

  scanDirectory(categoriesDir);

  console.log(`[SCAN LOG] Found ${inventory.length} visualizer plugin files across all categories.\n`);

  let migratedCount = 0;
  let remainingCount = 0;
  const results = [];

  for (const filePath of inventory) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    const hasGenerateGeometry = fileContent.includes('export function generateGeometry') || fileContent.includes('generateGeometry(');
    const hasRender = fileContent.includes('export function render(') || fileContent.includes('render(context)');
    const geomMatch = fileContent.match(/export function generateGeometry[\s\S]*$/);
    const geomBody = geomMatch ? geomMatch[0] : '';
    const usesCanvasAPI = geomBody.includes('ctx.') || geomBody.includes('renderer.draw');

    let pluginModule = null;
    let validPrimitives = false;

    if (hasGenerateGeometry) {
      try {
        const moduleUrl = pathToFileURL(filePath).href + '?t=' + Date.now();
        pluginModule = await import(moduleUrl);
        if (typeof pluginModule.generateGeometry === 'function') {
          const sampleFFT = { spectrum: new Uint8Array(64).fill(128), waveform: new Uint8Array(256).fill(128) };
          const sampleViewport = { width: 1920, height: 1080 };
          const sampleConfig = { barCount: 64, color: '#00ffcc' };
          const primitives = pluginModule.generateGeometry(sampleFFT, sampleViewport, sampleConfig, {});
          if (Array.isArray(primitives) && primitives.length > 0) {
            validPrimitives = true;
          }
        }
      } catch (err) {
        validPrimitives = false;
      }
    }

    const isMigrated = hasGenerateGeometry && validPrimitives;
    if (isMigrated) {
      migratedCount++;
    } else {
      remainingCount++;
    }

    results.push({
      file: relativePath,
      pluginId: pluginModule?.metadata?.id || path.basename(filePath, '.js'),
      hasGenerateGeometry,
      hasRender,
      usesCanvasAPI,
      validPrimitives,
      status: isMigrated ? 'PASS' : 'FAIL'
    });
  }

  console.log('-------------------------------------------------------------------------------------------------------------');
  console.log('| FILE                                           | PLUGIN ID               | GEN_GEOM | RENDER | STATUS  |');
  console.log('-------------------------------------------------------------------------------------------------------------');

  for (const r of results) {
    const fileShort = r.file.replace('src/visualizers/categories/', '').padEnd(46, ' ');
    const idShort = (r.pluginId || '').padEnd(23, ' ');
    const genGeom = r.hasGenerateGeometry ? '  YES   ' : '   NO   ';
    const render = r.hasRender ? '  YES ' : '  NO  ';
    const status = r.status === 'PASS' ? '🟢 PASS' : '🔴 FAIL';

    console.log(`| ${fileShort} | ${idShort} | ${genGeom} | ${render} | ${status} |`);
  }

  console.log('-------------------------------------------------------------------------------------------------------------');
  const coveragePercent = ((migratedCount / inventory.length) * 100).toFixed(2);

  console.log('\n================================================================');
  console.log('MF-4000 VISUALIZER PLUGIN MIGRATION COVERAGE METRICS');
  console.log('================================================================');
  console.log(`- Total Visualizer Plugin Files Scanned : ${inventory.length}`);
  console.log(`- Fully Migrated & Verified Plugins      : ${migratedCount}`);
  console.log(`- Remaining Legacy Plugins              : ${remainingCount}`);
  console.log(`- Final Migration Coverage Percentage   : ${coveragePercent}%`);
  console.log('================================================================\n');

  if (remainingCount === 0) {
    console.log('MF-4000 PLUGIN MIGRATION COMPLETE');
  } else {
    console.log('MF-4000 PLUGIN MIGRATION BELUM SELESAI');
  }
}

scanAndTestPlugins().catch(err => {
  console.error(err);
  process.exit(1);
});
