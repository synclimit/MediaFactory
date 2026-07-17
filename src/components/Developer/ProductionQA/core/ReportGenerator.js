export class ReportGenerator {
  static generateMarkdown(summary, results, historyRegressions) {
    let md = `# QA Execution Report\n\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n`;
    md += `**Health Score:** ${summary.healthScore}%\n`;
    md += `**Total:** ${summary.total} | **Passed:** ${summary.passed} | **Failed:** ${summary.failed} | **Skipped:** ${summary.skipped}\n\n`;

    if (historyRegressions && historyRegressions.detected) {
      md += `## ⚠️ Regressions Detected\n`;
      historyRegressions.reasons.forEach(r => {
        md += `- ${r}\n`;
      });
      md += `\n`;
    }

    md += `## Engine Results\n\n`;
    results.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : (r.status === 'FAIL' ? '❌' : '⚠️');
      md += `### ${icon} ${r.name}\n`;
      md += `- **Status:** ${r.status}\n`;
      md += `- **Execution Time:** ${r.executionTime.toFixed(2)}ms\n`;
      if (r.evidence) md += `- **Evidence:** ${r.evidence}\n`;
      if (r.metrics) md += `- **Metrics:** \`${JSON.stringify(r.metrics)}\`\n`;
      md += `\n`;
    });

    return md;
  }

  static generateCSV(results, categoryFilters = []) {
    let csv = 'Engine,Status,ExecutionTime(ms),Evidence\n';
    results.forEach(r => {
      if (categoryFilters.length === 0 || categoryFilters.includes(r.name)) {
        // simple CSV escaping
        const evidence = (r.evidence || '').replace(/"/g, '""');
        csv += `"${r.name}","${r.status}",${r.executionTime.toFixed(2)},"${evidence}"\n`;
      }
    });
    return csv;
  }

  static downloadBlob(content, filename, type = 'text/plain') {
    if (typeof window === 'undefined' || !window.document) return;
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
