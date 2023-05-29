import axios from "axios";

import {destroy} from "./destroy.mjs";
import { ErrorType, decoratedError } from "../browserup_errors.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {RemoteRuns} from "../services/remote_runs.mjs";
import {BrowserUpUrl} from "../utils/browserup_url.mjs";


export async function stop(options, program_opts) {
    try {
        log.debug("Running Stop");
        const filtersMsg = [];
        const credentials = ClusterCredentialsRepository.getCredentials(
            options,
          ["clusterUrl", "apiToken"]);
        log.debug("Validating credentials...");
        ExistingClusterValidator.validate(credentials);

        const optRunId = options["run_id"];
        if (optRunId) {
            filtersMsg.push(`Run ID = ${optRunId}`);
        }

        if (filtersMsg.length === 0) {
            log.info("Stopping all available user runs.");
        } else {
            log.info(`Stopping all user runs by filters: ${filtersMsg.join(",")}`);
        }

        log.info("Getting all active run ids");
        const runIdsToStop = [];

        if (optRunId) {
            runIdsToStop.push(optRunId);
        } else {
            const activeRunIds = await RemoteRuns.activeRunIds(credentials)
            runIdsToStop.push(...activeRunIds);
        }

        log.debug(`Run IDs to stop: ${runIdsToStop.toString()}`);

        await stopRemoteRuns(runIdsToStop, credentials);

        if (runIdsToStop.length > 0) {
            log.info(`SUCCESS: Stopped scenario. Remote run IDs stopped: ${runIdsToStop}`);
        } else {
            log.info("No active runs found by filters, nothing to stop.");
        }

        if (options["destroy"]) {
            await destroy(options);
        }
        log.debug("Stop completed successfully");
    }
    catch (e) {
        throw decoratedError({msg: `Failed to stop remote run`,  error: e, type: ErrorType.STOP_REMOTE_RUN});
    }
}

export async function stopRemoteRuns(runIds, credentials) {
    try {
        if (runIds.length === 0) {
            log.debug("Nothing to stop.");
            return;
        }
        for (const runId of runIds) {
            await sendStopRunRequest(runId, credentials);
        }
    }   catch (e) {
        throw decoratedError({msg: `Failed to stop remote run`,  error: e, type: ErrorType.STOP_REMOTE_RUN});

    }
}

export async function sendStopRunRequest(runId, credentials) {
    try {
        log.debug(`Sending stop Run with id: ${runId} request`);

        const runPatchUrl = `${BrowserUpUrl.browserupLoadUrl}/runs/${runId}`;
        const response = await axios.patch(runPatchUrl, null, {
            params: {api_token: credentials.apiToken},
            headers: {accept: "application/json"},
        });

        if (response.status >= 200 && response.status < 300) {
            log.debug(`Sent stop Run with id: ${runId} request successfully`);
        } else {
            throw decoratedError(`Unexpected response from WebConsole: ${response}`);
        }
    } catch (e) {
        throw decoratedError({msg: `Failed to stop remote run`,  error: e, type: ErrorType.STOP_REMOTE_RUN});
    }
}

