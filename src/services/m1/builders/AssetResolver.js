import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import AppPaths from '../../../../backend/system/AppPaths.js';

/**
 * AssetResolver
 * Responsible for mapping overlay assets, resolving paths, and caching data URLs.
 */
export class AssetResolver {
  /**
   * Resolves the absolute path for a given asset name, file path, or base64 Data URL.
   * Fails fast if the file does not exist.
   */
  static async resolve(assetName) {
    if (!assetName) throw new Error('AssetResolver: assetName is empty');

    // Handle Data URL (Base64 from file upload)
    if (typeof assetName === 'string' && assetName.startsWith('data:')) {
      const match = assetName.match(/^data:([a-zA-Z0-9\/-]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const base64Data = match[2];
        let ext = 'png';
        if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('webm')) ext = 'webm';
        else if (mime.includes('mp4')) ext = 'mp4';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('svg')) ext = 'svg';

        const hash = crypto.createHash('md5').update(base64Data.slice(0, 100)).digest('hex').slice(0, 8);
        const cacheBase = AppPaths ? AppPaths.getCacheBase() : path.resolve('.mediafactory_data/Cache');
        const cacheDir = path.join(cacheBase, 'assets');
        await fs.mkdir(cacheDir, { recursive: true });
        const filePath = path.join(cacheDir, `upload_${hash}.${ext}`);
        await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
        return filePath;
      }
    }

    if (path.isAbsolute(assetName)) {
      if (existsSync(assetName)) {
        return assetName;
      }
      throw new Error(`AssetResolver: Missing required absolute asset. Path not found: ${assetName}`);
    }
    
    // Check multiple asset candidate locations
    const candidateDirs = [
      AppPaths ? path.join(AppPaths.getMediaFactoryDataDir(), 'assets') : '',
      AppPaths ? path.join(AppPaths.getCacheBase(), 'assets') : '',
      path.resolve(process.cwd(), '.mediafactory', 'assets'),
      path.resolve(process.cwd(), 'assets'),
      path.resolve(process.cwd(), 'assets', 'SocialWidgets', 'Subscribe'),
      path.resolve(process.cwd(), 'assets', 'branding'),
      process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'assets') : '',
      process.resourcesPath ? path.resolve(process.resourcesPath, '..', 'assets', 'SocialWidgets', 'Subscribe') : '',
      process.resourcesPath ? path.resolve(process.resourcesPath, 'app', 'assets') : ''
    ].filter(Boolean);

    for (const dir of candidateDirs) {
      const p = path.join(dir, assetName);
      if (existsSync(p)) {
        return p;
      }
    }

    throw new Error(`AssetResolver: Missing required asset '${assetName}'. Looked in candidate directories: ${candidateDirs.join(', ')}`);
  }
}
