import axios from "axios";
import {logAndExit} from "../utils/cli_helpers.mjs";

export async function init(options, program_opts) {
    log.debug("Running Init");
    try {
        const credentials = await ClusterCredentialsRepository.getCredentials(
            options,
            ["cluster_url", "api_token"]
        );

        ExistingClusterValidator.validate(credentials);
        const activeRunIds = await RemoteRuns.getActiveRunIds(credentials);

        let runId = options["run"];
        runId ||= LocalEnvVars.getSecret("last_run_id");

        if (runId === undefined) {
            log.info("No run id passed, and last run id was empty");
            process.exit(1);
        }

        if (runId && activeRunIds.length > 0) {
            log.info(`The last run started from this machine was ${runId}.`);
            const lastRunStatus = activeRunIds.includes(runId) ? "active" : "not active";
            log.info(`Run ${runId} is ${lastRunStatus}`);
        } else {
            log.info("Run not active");
        }
    } catch (error) {
        if (error instanceof InvalidClusterCredentials) {
            log.info("No active cluster credentials found");
        } else {
            log.info(error.message);
        }
        logAndExit(error.message);
    }
    log.debug("Init completed successfully");
}
