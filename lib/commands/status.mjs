import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {logAndExit} from "../utils/cli_helpers.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {RemoteRuns} from "../services/remote_runs.mjs"
import {ErrorType}  from "../browserup_errors.mjs";
export async function status(options, program_opts) {
    log.debug("Running Status");
    try {
        const credentials = await ClusterCredentialsRepository.getCredentials(options,
            ["clusterUrl", "apiToken"]
        );

        ExistingClusterValidator.validate(credentials);
        const activeRunIds = await RemoteRuns.activeRunIds(credentials);

        let runId = options["run"];
        runId ||= LocalEnvVars.getSecret("last_run_id");

        if (runId === undefined) {
           return logAndExit("No run id passed, and last run id was empty");
        }

        if (runId && activeRunIds.length > 0) {
            log.info(`The last run started from this machine was ${runId}.`);
            const lastRunStatus = activeRunIds.includes(runId) ? "active" : "not active";
            log.info(`Run ${runId} is ${lastRunStatus}`);
        } else {
            log.info("Run not active");
        }
    } catch (e) {
        if (e.errorType === ErrorType.INVALID_CLUSTER_CREDENTIALS) {
            log.info("No active cluster credentials found");
        } else {
            log.info(e.message);
        }
    }
    log.debug("Status completed successfully");
}

