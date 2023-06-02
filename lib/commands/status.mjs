import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {logErrors} from "../utils/cli_helpers.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {RemoteRuns} from "../services/remote_runs.mjs"
import {decoratedError, ErrorType} from "../browserup_errors.mjs";
import {LocalEnvVars} from "../utils/local_env_vars.mjs";

export async function status(options, _programOpts) {
    log.debug("Running Status");
    const credentials = ClusterCredentialsRepository.getCredentials(options,
        ["clusterUrl", "apiToken"]
    );

    ExistingClusterValidator.validate(credentials);

    const activeRunIds = await RemoteRuns.activeRunIds(credentials);
    const runId = options["run"] || LocalEnvVars.getSecret("lastRunId");

    if (runId === undefined) {
        log.info(`No run id passed, and last run id was empty`)
        return
    }

    if (runId && activeRunIds.length > 0) {
        log.info(`The last run started from this machine was ${runId}.`);
        const lastRunStatus = activeRunIds.includes(String(runId)) ? "active" : "not active";
        log.info(`Run ${runId} is ${lastRunStatus}`);
    } else {
        log.info("Run not active");
    }
    log.debug("Status completed successfully");
}

