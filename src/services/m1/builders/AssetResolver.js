import fs from 'fs/promises';
import path from 'path';

/**
 * AssetResolver
 * Responsible for mapping overlay assets and validating their existence.
 */
export class AssetResolver {
  /**
   * Resolves the absolute path for a given asset name.
   * Fails fast if the file does not exist.
   */
  static async resolve(assetName) {
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
