import {ConfigRepository} from "../services/config_repository.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {decoratedError, ErrorType} from "../browserup_errors.mjs";
import {mkdirSync, writeFileSync} from "fs";

import chalk from "chalk";
import axios from "axios";
import path from 'path';
import {ClusterSecretsProvider} from "../services/cluster_secrets_provider.mjs";
import {LocalEnvVars} from "../utils/local_env_vars.mjs";
import {WebConsoleClient} from "../services/webconsole_client.mjs";

export async function reports(args, programOpts) {
    log.debug("Running Reports");
    if (args["upload"] && args["name"] !== 'system') {
        await uploadReports(programOpts)
    }
    const configRepo = new ConfigRepository(programOpts["config"]);
    let reports = configRepo.config.reports();
    const credentials = ClusterCredentialsRepository.getCredentials(
        programOpts, ["apiToken", "clusterUrl"]);
    let overallResult = true;
    if (reports === undefined || reports.length === 0) {
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

    switch (args["name"]) {
        case "system":
            reports = systemReports;
            break;
        case "all":
        case null:
            reports = reports.concat(systemReports);
            break;
        default:
            reports = [args["name"]];
    }

    for (const report of reports) {
        const result = await runReport(credentials, report, args);
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
    let reports = configRepo.config.reports();
    if (reports === undefined || reports.length === 0) {
        throw decoratedError("No reports defined")
    }
    const credentials = ClusterCredentialsRepository.getCredentials(
        options, ["apiToken", "clusterUrl"]);
    let overallResult = true;
    const lastRunId = LocalEnvVars.getSecret("lastRunId");
    if (lastRunId === undefined) {
        throw decoratedError("Expected a last run id for the last started test on this install, but none found")
    }
    for (const report of reports) {
        const result = await createOrUpdateReport(credentials, report, lastRunId);
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
    const lastRunId = LocalEnvVars.getSecret("lastRunId");
    if (lastRunId === undefined) {
        throw decoratedError("Expected a last run id for the last started test on this install, but none found")
    }
    try {
        const response = await WebConsoleClient.sendGetRequest({
            path: `/load/reports/${reportName}`,
            qParams: {
                api_token: credentials.apiToken,
                run: lastRunId,
                standalone: true
            },
            extraHeaders: {
                Accept: 'text/html'
            }
        })
        const isPassed = response.headers["browserup-report-checks-passed"] === 'true';

        if (options["output"]) {
            const targetDir = options["output"];
            mkdirSync(targetDir, {recursive: true});
            const outfile = path.join(targetDir, `${reportName}.html`);
            log.info(`Saving: ${outfile}`);
            writeFileSync(outfile, response.data);
        }

        return isPassed;
    } catch (e) {
        throw decoratedError({msg: "Failed to get reports", error: e})
    }
}

export async function createOrUpdateReport(credentials, report, lastRunId) {
    const reportName = report["name"];
    //do we need it?
    //delete report["name"];
    log.info(`Creating/updating report: "${reportName}"`);

    const payload = {
        report: {
            name: reportName,
            definition: report,
        },
    };

    try {
        const response = await WebConsoleClient.sendPostRequest({
            qParams: {
                api_token: credentials.apiToken,
                run: lastRunId
            },
            path: `/load/reports/${reportName}`,
            data: payload,
            expectedCodes: [200]
        })
        const reportData = response.data;
        log.debug(`Response (Remote report): ${JSON.stringify(reportData, null, 2)}`);
        return reportData;
    } catch (e) {
        throw decoratedError({
            msg: `Failed to create or update report: ${reportName}`, error: e, type: ErrorType.UPLOAD_REPORT
        });
    }
}

