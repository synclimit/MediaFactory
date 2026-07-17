export class QAValidatorBase {
  constructor(name, dependencies = []) {
    this.name = name;
    this.dependencies = dependencies;
  }

  /**
   * Must return { status: 'PASS' | 'FAIL' | 'NOT EXECUTED', evidence: string, metrics: object }
   */
  async execute(config) {
    throw new Error('execute() must be implemented by subclass');
  }

  createResult(status, evidence, metrics = {}) {
    return { status, evidence, metrics };
  }

  pass(evidence, metrics = {}) {
    return this.createResult('PASS', evidence, metrics);
  }

  fail(evidence, metrics = {}) {
    return this.createResult('FAIL', evidence, metrics);
  }

  notExecuted(evidence, metrics = {}) {
    return this.createResult('NOT EXECUTED', evidence, metrics);
  }
}
