import { QADependencyGraph } from './QADependencyGraph.js';
import { audioValidators } from '../validators/AudioValidators.js';
import { subtitleValidators } from '../validators/SubtitleValidators.js';
import { visualValidators } from '../validators/VisualValidators.js';
import { pipelineValidators } from '../validators/PipelineValidators.js';
import { systemValidators } from '../validators/SystemValidators.js';

export class QARunner {
  constructor(config) {
    this.config = config;
    this.graph = new QADependencyGraph();
    this.validators = new Map();
    this.onProgress = null;
    this.onComplete = null;
    
    this._initializeGraph();
  }

  _initializeGraph() {
    const allValidators = [
      ...audioValidators,
      ...subtitleValidators,
      ...visualValidators,
      ...pipelineValidators,
      ...systemValidators
    ];
    
    for (const v of allValidators) {
      this.validators.set(v.name, v);
      this.graph.registerValidator(v.name, v.dependencies);
    }
  }

  async run(progressCallback) {
    this.onProgress = progressCallback;
    const nodes = this.graph.getSortedNodes();
    let passedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    for (const node of nodes) {
      const validator = this.validators.get(node.name);
      
      if (this.graph.shouldSkip(node.name)) {
        this.graph.updateNodeStatus(node.name, 'SKIPPED', 'Parent dependency failed or was skipped');
        skippedCount++;
      } else {
        this.graph.updateNodeStatus(node.name, 'RUNNING');
        if (this.onProgress) this.onProgress(this.graph.nodes);
        
        try {
          const result = await validator.execute(this.config);
          this.graph.updateNodeStatus(node.name, result.status, result.evidence, result.metrics, result.metrics?.latencyMs || 0);
          
          if (result.status === 'PASS') passedCount++;
          else if (result.status === 'FAIL') failedCount++;
          else if (result.status === 'NOT EXECUTED') skippedCount++; // Not executed acts like skipped for dependents
        } catch (err) {
          this.graph.updateNodeStatus(node.name, 'FAIL', err.message);
          failedCount++;
        }
      }
      
      if (this.onProgress) this.onProgress(this.graph.nodes);
    }
    
    const results = Array.from(this.graph.nodes.values());
    const healthScore = Math.max(0, Math.round(((passedCount) / (nodes.length - skippedCount)) * 100)) || 0;
    
    return {
      results,
      summary: {
        total: nodes.length,
        passed: passedCount,
        failed: failedCount,
        skipped: skippedCount,
        healthScore
      }
    };
  }
}
