export class QABenchmarkHistory {
  constructor() {
    this.historyKey = 'mf_qa_benchmark_history';
  }

  getHistory() {
    try {
      const data = localStorage.getItem(this.historyKey);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('[QABenchmarkHistory] Failed to read history', err);
      return [];
    }
  }

  saveBenchmark(metrics) {
    const history = this.getHistory();
    const buildId = `Build_${Date.now()}`;
    const record = {
      buildId,
      timestamp: new Date().toISOString(),
      metrics
    };
    history.push(record);
    // Keep last 50 builds
    if (history.length > 50) history.shift();
    
    try {
      localStorage.setItem(this.historyKey, JSON.stringify(history));
    } catch (err) {
      console.error('[QABenchmarkHistory] Failed to save history', err);
    }
    return record;
  }

  detectRegressions(currentMetrics) {
    const history = this.getHistory();
    if (history.length === 0) return { detected: false, reasons: [] };

    const lastBuild = history[history.length - 1].metrics;
    const reasons = [];
    
    // Performance Regression
    if (currentMetrics.fps && lastBuild.fps && currentMetrics.fps < lastBuild.fps * 0.9) {
      reasons.push(`FPS dropped by >10%: ${lastBuild.fps} -> ${currentMetrics.fps}`);
    }
    
    // Memory Regression
    if (currentMetrics.heapGrowthMB && lastBuild.heapGrowthMB && currentMetrics.heapGrowthMB > lastBuild.heapGrowthMB * 1.2) {
      reasons.push(`Heap Growth increased by >20%: ${lastBuild.heapGrowthMB}MB -> ${currentMetrics.heapGrowthMB}MB`);
    }

    // Render Regression
    if (currentMetrics.renderTimeMs && lastBuild.renderTimeMs && currentMetrics.renderTimeMs > lastBuild.renderTimeMs * 1.1) {
      reasons.push(`Render Time increased by >10%: ${lastBuild.renderTimeMs}ms -> ${currentMetrics.renderTimeMs}ms`);
    }

    return {
      detected: reasons.length > 0,
      reasons
    };
  }
}
