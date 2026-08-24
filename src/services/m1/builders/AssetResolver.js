import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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
        const cacheDir = path.resolve(process.cwd(), '.mediafactory', 'assets');
        await fs.mkdir(cacheDir, { recursive: true });
        const filePath = path.join(cacheDir, `upload_${hash}.${ext}`);
        await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
        return filePath;
      }
    }

    if (path.isAbsolute(assetName)) {
      try {
        await fs.access(assetName);
        return assetName;
      } catch (e) {
        throw new Error(`AssetResolver: Missing required absolute asset. Path not found: ${assetName}`);
      }
    }
    
    // For Sprint 4, we use a central assets folder in the repository.
    // In production, this would bridge to WorkspaceService for specific user uploads.
    const assetPath = path.resolve(process.cwd(), '.mediafactory', 'assets', assetName);
    
    try {
      await fs.access(assetPath);
      return assetPath;
    } catch (e) {
      throw new Error(`AssetResolver: Missing required asset '${assetName}'. Path not found: ${assetPath}`);
    }
  }
}
