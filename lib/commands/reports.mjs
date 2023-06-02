import {ConfigRepository} from "../services/config_repository.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {decoratedError, ErrorType} from "../browserup_errors.mjs";
import {mkdirSync, writeFileSync} from "fs";

import chalk from "chalk";
import axios from "axios";
import path from 'path';
import {ClusterSecretsProvider} from "../services/cluster_secrets_provider.mjs";

export async function reports(args, programOpts) {
    log.debug("Running Reports");
    const configRepo = new ConfigRepository(programOpts["config"]);
    let reports = configRepo.config.reports;
    const credentials = ClusterCredentialsRepository.getCredentials(
        programOpts, ["apiToken", "clusterUrl"]);
    let overallResult = true;
    if (reports === null || reports.length === 0) {
        throw decoratedError({msg: 'No Reports Defined', errorType: ErrorType.NO_REPORTS_DEFINED});
    }
    reports = reports.map((report) => report["name"]);
    const systemReports = [
        "bandwidth",
        "connections",
        "errors",
        "hits",
        "profiles",
        "steps",
        "summary",
        "system",
        "urls",
        "browser",
        "websockets",
    ];

    switch (programOpts["name"]) {
        case "system":
            reports = systemReports;
            break;
        case "all":
        case null:
            reports = reports.concat(systemReports);
            break;
        default:
            reports = [programOpts["name"]];
    }

    for (const report of reports) {
        const result = await runReport(credentials, report, programOpts);
        overallResult = overallResult && result;
        const passFail = result
            ? chalk.green("passed")
            : chalk.red("failed");
        log.info(`Report ${chalk.blue(report)}: ${passFail}`);
    }
    log.info(
        `Overall Reports SLA Result: ${
            overallResult ? chalk.green("passed") : chalk.red("failed")
        }`
    );
    const exitCode = overallResult ? 0 : 1;
    log.debug(`Reports completed successfully with exit code: ${exitCode}`);
    process.exit(exitCode);
}

export async function uploadReports(options) {
    const configRepo = new ConfigRepository(options["config"]);
    let reports = configRepo.config.reports;
    if (reports === null || reports.length === 0) {
        const e= new Error('No Reports Defined');
        e.errorType ||= ErrorType.NO_REPORTS_DEFINED;
        throw(e);
    }
    const credentials = ClusterCredentialsRepository.getCredentials(
        options, ["apiToken", "clusterUrl"]);
    let overallResult = true;
    for (const report of reports) {
        const result = await createOrUpdateReport(credentials, report);
        overallResult = overallResult && result;
        log.info(`Uploaded Report ${report}: ${result}`);
    }
    log.info(
        `Report Upload: ${
            overallResult ? chalk.green("succeeded") : chalk.red("failed")
        }`
    );
}

export async function runReport(credentials, reportName, options) {
    log.info(`Running ${chalk.blue(reportName)}`);
    const lastRunId = ClusterSecretsProvider.get()["lastRunId"];
    if (lastRunId === undefined) {
        const e= new Error('No Reports Defined');
        e.message = "Expected a last run id for the last started test on this install, but none found"
        e.errorType ||= ErrorType.NO_LAST_RUN_ID;
        throw(e);
    }
    const url = `${credentials.clusterUrl}/load/reports/studio/${reportName}?api_token=${credentials.apiToken}&run=${lastRunId}&standalone=true`;
    log.info(`Report URL: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: {Accept: "text/html"},
        });
        const isPassed = !!response.headers["browserup-report-checks-passed"];
        let rawData = response.data;

        if (options["output"]) {
            const targetDir =
                options["output"] === "output" ? process.cwd() : options["output"];
            mkdirSync(targetDir, {recursive: true});
            const outfile = path.join(targetDir, `${reportName}.html`);
            log.info(`Saving: ${outfile}`);
            writeFileSync(outfile, rawData);
        }

        return isPassed;
    } catch (e) {
        if (e.code === "ECONNREFUSED") {
            throw decoratedError({error: e, msg: `Unable to connect to BrowserUp Server at ${credentials.clusterUrl}`, type: ErrorType.CLUSTER_NOT_FOUND });
        } else if (e.code === "ECONNRESET") {
            throw decoratedError({error: e,
                type: ErrorType.INVALID_CLUSTER_CREDENTIALS,
                msg: `Authorization failed while getting run ID"s with ${credentials.apiToken}`});
        } else {
            throw e;
        }
    }
}

export async function createOrUpdateReport(credentials, report) {
    const reportName = report["name"];
    delete report["name"];
    log.info(`Creating/updating report: "${reportName}"`);
    const url = `${credentials.clusterUrl}/load/reports/studio`;
    const payload = {
        report: {
            name: reportName,
            definition: report,
        },
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 200) {
            throw decoratedError({msg: `Failed to create or update report: ${reportName}`,  type: ErrorType.UPLOAD_REPORT});
        }
        const reportData = response.data;
        log.debug(`Response (Remote report): ${JSON.stringify(reportData, null, 2)}`);
        return reportData;
    } catch (e) {
        log.error(`Request error: ${e.message}`);
        throw decoratedError({msg: `Failed to create or update report: ${reportName}`,  error: e, type: ErrorType.UPLOAD_REPORT});
    }
}

