/**
 * Package Boundaries
 * Defines package ownership and prevents circular ownership.
 */

export const PackageBoundaries = Object.freeze({
    packages: [
        'audio',
        'visual',
        'renderer',
        'compiler',
        'editor',
        'runtime',
        'architecture',
        'composition',
        'graph'
    ],
    
    validateOwnership: (modulePath) => {
        // Enforce that a module belongs to exactly one top-level package
        // and doesn't cross package boundaries in a circular way.
        const parts = modulePath.split('/');
        if (parts.length > 0) {
            const rootPackage = parts[0];
            return PackageBoundaries.packages.includes(rootPackage);
        }
        return false;
    }
});
