// Import necessary libraries
import dotenv from "dotenv";
import debug from "debug";
import {LocalEnvVars} from "./local_env_vars.mjs";

// Initialize dotenv and debug
dotenv.config();
const logDebug = debug("app:debug");

export class BrowserUpUrl {
  static browserupUrl() {
    const result = LocalEnvVars.getEnvOrSecret('BROWSERUP_URL_OVERRIDE', 'clusterUrl');
    log.debug(`BrowserUp Cluster URL: ${result}`);
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
