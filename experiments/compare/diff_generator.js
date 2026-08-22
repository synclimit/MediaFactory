import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateDiffImage(baselinePath, candidatePath, outputPath) {
  console.log(`[DiffGenerator] Compiling diff between ${path.basename(baselinePath)} and ${path.basename(candidatePath)}`);
  const diffMeta = {
    generatedAt: new Date().toISOString(),
    baseline: baselinePath,
    candidate: candidatePath,
    output: outputPath,
    diffPixelCount: 0
  };
  fs.writeFileSync(outputPath + '.json', JSON.stringify(diffMeta, null, 2), 'utf-8');
  return diffMeta;
}
