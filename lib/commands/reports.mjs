import {ConfigRepository} from "../services/config_repository.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {UploadReportError} from "../exceptions.mjs";
import {mkdirSync, writeFileSync} from "fs";
import chalk from "chalk";
import axios from "axios";

export async function reports(args, options) {
    log.debug("Running Reports");
    const configRepo = new ConfigRepository(options["config"]);
    let reports = configRepo.config.reports;
    const config = configRepo.config;
    const credentials = await ClusterCredentialsRepository.getCredentials({
        options: options,
        requiredFields: ["api_token", "cluster_url"],
    });
    let overallResult = true;
    if (reports === null || reports.length === 0) {
        throw new BrowserUpNoReportsDefined();
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

    switch (options["name"]) {
        case "system":
            reports = systemReports;
            break;
        case "all":
        case null:
            reports = reports.concat(systemReports);
            break;
        default:
            reports = [options["name"]];
    }

    for (const report of reports) {
        const result = await Commands.runReport(credentials, report, options);
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
    const config = configRepo.config;
    if (reports === null || reports.length === 0) {
        throw new BrowserUpNoReportsDefined();
    }
    const credentials = await ClusterCredentialsRepository.getCredentials({
        options: options,
        requiredFields: ["api_token", "cluster_url"],
    });
    const apiToken = credentials.apiToken;
    let overallResult = true;
    for (const report of reports) {
        const result = await Commands.createOrUpdateReport(credentials, report);
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
    const lastRunId = process.env["last_run_id"];
    if (lastRunId === undefined) {
        throw new NoLastRunIdError(
            "Expected a last run id for the last started test on this install, but none found"
        );
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
            const outfile = join(targetDir, `${reportName}.html`);
            log.info(`Saving: ${outfile}`);
            writeFileSync(outfile, rawData);
        }

        return isPassed;
    } catch (error) {
        if (error.code === "ECONNREFUSED") {
            throw new BrowserUpClusterNotFound(
                `Unable to connect to BrowserUp Server at ${credentials.clusterUrl}`
            );
        } else if (error.code === "ECONNRESET") {
            throw new InvalidClusterCredentials(
                `Authorization failed while getting run ID"s with ${credentials.apiToken}`
            );
        } else {
            throw error;
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
            throw new UploadReportError(
                `Failed to create or update report: ${reportName}`
            );
        }
        const reportData = response.data;
        log.debug(`Response (Remote report): ${JSON.stringify(reportData, null, 2)}`);
        return reportData;
    } catch (error) {
        log.error(`Request error: ${error.message}`);
        throw new UploadReportError(error);
    }
}

