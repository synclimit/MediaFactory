export class QADependencyGraph {
  constructor() {
    this.nodes = new Map();
  }

  registerValidator(name, dependencies = []) {
    this.nodes.set(name, {
      name,
      dependencies,
      status: 'WAITING', // WAITING, RUNNING, PASS, FAIL, SKIPPED, NOT EXECUTED
      evidence: null,
      metrics: null,
      executionTime: 0
    });
  }

  getSortedNodes() {
    const sorted = [];
    const visited = new Set();
    const temp = new Set();

    const visit = (nodeName) => {
      if (temp.has(nodeName)) throw new Error(`Circular dependency detected: ${nodeName}`);
      if (!visited.has(nodeName)) {
        temp.add(nodeName);
        const node = this.nodes.get(nodeName);
        if (node) {
          node.dependencies.forEach(dep => visit(dep));
          visited.add(nodeName);
          sorted.push(nodeName);
        }
        temp.delete(nodeName);
      }
    };

    for (const name of this.nodes.keys()) {
      if (!visited.has(name)) {
        visit(name);
      }
    }
    return sorted.map(name => this.nodes.get(name));
  }

  updateNodeStatus(name, status, evidence = null, metrics = null, executionTime = 0) {
    const node = this.nodes.get(name);
    if (node) {
      node.status = status;
      node.evidence = evidence;
      node.metrics = metrics;
      node.executionTime = executionTime;
    }
  }

  shouldSkip(nodeName) {
    const node = this.nodes.get(nodeName);
    if (!node) return false;

    // Check if any dependency failed or was skipped
    for (const dep of node.dependencies) {
      const depNode = this.nodes.get(dep);
      if (depNode && (depNode.status === 'FAIL' || depNode.status === 'SKIPPED' || depNode.status === 'NOT EXECUTED')) {
        return true; // Parent failed, so skip this one
      }
    }
    return false;
  }
}
