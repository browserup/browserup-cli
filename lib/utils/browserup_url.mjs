// Import necessary libraries
import dotenv from 'dotenv';
import debug from 'debug';

// Initialize dotenv and debug
dotenv.config();
const logDebug = debug('app:debug');

export class BrowserUpUrl {
  static browserupUrl() {
    const result = process.env.BROWSERUP_URL_OVERRIDE || process.env.CLUSTER_URL;
    log.info(`result ${result}`);
    return result;
  }

  static browserupLoadUrl() {
    return `${this.browserupUrl()}/load`;
  }

  static browserupLoadSummaryReportUrl() {
    const url = `${this.browserupLoadUrl()}/reports/latest_report`;
    logDebug(`browserup_load_summary_report_url=${url}`);
    return url;
  }
}
