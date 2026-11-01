/**
 * ReportPortal Client & Reporter for Green & Tasty Automation Suite
 * Handles test launch lifecycle, suite execution logs, and artifact generation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ReportPortalReporter {
  constructor(options = {}) {
    this.endpoint = options.endpoint || process.env.REPORTPORTAL_ENDPOINT || 'https://reportportal.epam.com/api/v1';
    this.apiKey = options.apiKey || process.env.REPORTPORTAL_API_KEY || '';
    this.project = options.project || process.env.REPORTPORTAL_PROJECT || 'green_and_tasty_qa';
    this.launchName = options.launchName || process.env.REPORTPORTAL_LAUNCH || 'EPAM_Marathon_HW8_E2E';
    this.launchId = `launch-${Date.now()}`;
    this.startTime = new Date().toISOString();
    this.testItems = [];
  }

  startLaunch() {
    return {
      id: this.launchId,
      name: this.launchName,
      startTime: this.startTime,
      status: 'IN_PROGRESS'
    };
  }

  recordTest(name, status, durationMs = 0, error = null, level = 'Level 1') {
    const item = {
      id: `item-${this.testItems.length + 1}`,
      launchId: this.launchId,
      name,
      level,
      status: status ? 'PASSED' : 'FAILED',
      durationMs,
      timestamp: new Date().toISOString(),
      error: error ? String(error) : null
    };
    this.testItems.push(item);
    return item;
  }

  finishLaunch() {
    const endTime = new Date().toISOString();
    const passedCount = this.testItems.filter(i => i.status === 'PASSED').length;
    const failedCount = this.testItems.filter(i => i.status === 'FAILED').length;

    const reportSummary = {
      launch: {
        id: this.launchId,
        name: this.launchName,
        project: this.project,
        endpoint: this.endpoint,
        startTime: this.startTime,
        endTime: endTime,
        status: failedCount === 0 ? 'PASSED' : 'FAILED'
      },
      statistics: {
        total: this.testItems.length,
        passed: passedCount,
        failed: failedCount,
        passRatio: `${((passedCount / (this.testItems.length || 1)) * 100).toFixed(1)}%`
      },
      items: this.testItems
    };

    // Ensure reports directory exists
    const reportsDir = path.resolve(__dirname, '../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'reportportal-summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportSummary, null, 2), 'utf8');

    return reportSummary;
  }
}

export default ReportPortalReporter;
