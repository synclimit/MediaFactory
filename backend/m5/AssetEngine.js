const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const { PipelineError, ErrorCodes } = require('./core/Errors');
const RandomSystem = require('./core/RandomSystem');
const EngineRegistry = require('./core/EngineRegistry');
const Engine = require('./core/Engine');

class AssetEngine extends Engine {
    /**
     * @param {PipelineContext} context 
     * @param {Object} job
     */
    async selectAssets(context, job) {
        return this.runAsync(context, 'AssetEngine', async () => {
            const UsageRepository = EngineRegistry.resolve('UsageRepository');

            const getAsset = async (folderObj, category) => {
                if (!folderObj || folderObj.length === 0) return null;
                const asset = await UsageRepository.getNextAvailableAsset(folderObj, category, RandomSystem);
                if (asset) {
                    await UsageRepository.markUsed(asset.id, 1);
                    return {
                        assetId: asset.id,
                        libraryId: asset.library_id,
                        absolutePath: asset.path,
                        fileName: asset.filename,
                        hash: asset.id, 
                        duration: asset.duration,
                        fps: asset.fps,
                        width: asset.width,
                        height: asset.height,
                        category: category,
                        type: 'video'
                    };
                }
                return null;
            };

            const path = require('path');
            const fsSync = require('fs');

            const getFallbackAsset = (category, filename = 'test_bg.mp4', duration = 15) => {
                const filePath = path.resolve(__dirname, '../../', filename);
                const exists = fsSync.existsSync(filePath);
                const absPath = exists ? filePath : path.resolve(__dirname, '../../dummy.mp4');
                return {
                    assetId: 'fallback_' + category.toLowerCase().replace(/\s+/g, '_'),
                    libraryId: 'fallback_lib',
                    absolutePath: absPath,
                    fileName: path.basename(absPath),
                    hash: 'fallback_' + category,
                    duration: duration,
                    fps: 30,
                    width: 1080,
                    height: 1920,
                    category: category,
                    type: 'video'
                };
            };

            let videoA = await getAsset(job.libraryFolders?.videoA, 'Video A');
            let videoB = await getAsset(job.libraryFolders?.videoB, 'Video B');
            let hook = await getAsset(job.libraryFolders?.hook, 'Hook');
            let cta = await getAsset(job.libraryFolders?.cta, 'CTA');
            let background = await getAsset(job.libraryFolders?.background, 'Background');
            let audio = await getAsset(job.libraryFolders?.audio, 'Audio');
            let subscribe = await getAsset(job.libraryFolders?.subscribe, 'Subscribe');
            let arrow = await getAsset(job.libraryFolders?.arrow, 'Arrow');

            if (!videoA) {
                videoA = videoB || background || hook || cta || getFallbackAsset('Video A', 'test_bg.mp4', 15);
            }
            if (!hook && job.formula !== 'OVERLAY') {
                hook = videoA || getFallbackAsset('Hook', 'test_bg.mp4', 5);
            }
            if (!cta && job.formula !== 'OVERLAY') {
                cta = videoA || getFallbackAsset('CTA', 'test_bg.mp4', 5);
            }
            if (!videoB && job.formula !== 'OVERLAY') {
                videoB = videoA || getFallbackAsset('Video B', 'test_bg.mp4', 10);
            }
            if (!background) {
                background = videoA || getFallbackAsset('Background', 'test_bg.mp4', 15);
            }

            const projectAsset = {
                videoA,
                videoB,
                hook,
                cta,
                background,
                audio,
                subscribe,
                arrow,
                main: videoA
            };

            return projectAsset;
        });
    }
}

module.exports = AssetEngine;
