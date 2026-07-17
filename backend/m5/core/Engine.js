const EngineResult = require('./EngineResult');
const Logger = require('./Logger');

class Engine {
    /**
     * Protected base runner.
     * All semantic public APIs (e.g. selectAssets) must delegate to this method.
     * It enforces timing, error handling, logging, and returns standard EngineResult.
     * 
     * @param {PipelineContext} context 
     * @param {string} engineName - e.g. 'AssetEngine'
     * @param {Function} executionBlock - Function containing business logic that returns data
     */
    run(context, engineName, executionBlock) {
        const start = context.clock.now();
        const startMemory = process.memoryUsage().heapUsed;
        
        if (context.cancellationToken?.isCancelled) {
            return EngineResult.error('Pipeline Cancelled', { engine: engineName });
        }

        try {
            // Pre-execution lifecycle hook logic if needed here
            context.diagnostics.emit(`${engineName}_STARTED`, { time: start });
            
            // Execute Business Logic
            const resultData = executionBlock();
            
            // If the execution block returned a Promise, we must handle it async.
            // For simplicity in this architecture base, we assume synchronous or handled properly in subclasses.
            // If async is needed, the `runAsync` method should be implemented similarly.
            
            const end = context.clock.now();
            const endMemory = process.memoryUsage().heapUsed;
            const metrics = {
                executionTimeMs: end - start,
                memoryDeltaBytes: endMemory - startMemory,
                engineVersion: '1.0'
            };

            context.diagnostics.emit(`${engineName}_FINISHED`, { metrics });

            return EngineResult.success(Object.freeze(resultData), metrics);

        } catch (error) {
            context.logger.error(engineName, `Execution failed`, error);
            context.diagnostics.emit(`${engineName}_FAILED`, { error: error.message });
            
            return EngineResult.error(error, { 
                executionTimeMs: context.clock.now() - start 
            });
        }
    }

    /**
     * Async runner for engines like AssetEngine that need DB await.
     */
    async runAsync(context, engineName, executionBlock) {
        const start = context.clock.now();
        const startMemory = process.memoryUsage().heapUsed;
        
        if (context.cancellationToken?.isCancelled) {
            return EngineResult.error('Pipeline Cancelled', { engine: engineName });
        }

        try {
            context.diagnostics.emit(`${engineName}_STARTED`, { time: start });
            
            const resultData = await executionBlock();
            
            const end = context.clock.now();
            const endMemory = process.memoryUsage().heapUsed;
            const metrics = {
                executionTimeMs: end - start,
                memoryDeltaBytes: endMemory - startMemory,
                engineVersion: '1.0'
            };

            context.diagnostics.emit(`${engineName}_FINISHED`, { metrics });

            return EngineResult.success(Object.freeze(resultData), metrics);

        } catch (error) {
            context.logger.error(engineName, `Execution failed`, error);
            context.diagnostics.emit(`${engineName}_FAILED`, { error: error.message });
            
            return EngineResult.error(error, { 
                executionTimeMs: context.clock.now() - start 
            });
        }
    }
}

module.exports = Engine;
