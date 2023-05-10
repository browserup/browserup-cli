import axios from 'axios';
import '../services/cluster_credentials_repository.mjs';
import '../services/existing_cluster_validator.mjs';
import '../services/remote_runs.mjs';
import './destroy.mjs';

import {InvalidClusterCredentials, StopRemoteRunError} from '../exceptions.mjs';
import {logAndExit} from "../utils/cli_helpers.mjs";

export async function stop(options) {
    log.debug('Running Stop');
    const filtersMsg = [];
    const credentials = await ClusterCredentialsRepository.getCredentials({
        options,
        requiredFields: ['cluster_url', 'api_token'],
    });

    await ExistingClusterValidator.validate(credentials);

    const optRunId = options['run_id'];
    if (optRunId) {
        filtersMsg.push(`Run ID = ${optRunId}`);
    }

    if (filtersMsg.length === 0) {
        log.info('Stopping all available user runs.');
    } else {
        log.info(`Stopping all user runs by filters: ${filtersMsg.join(',')}`);
    }

    log.info('Getting all active run ids');
    const runIdsToStop = [];

    if (optRunId) {
        runIdsToStop.push(optRunId);
    } else {
        runIdsToStop.push(...await RemoteRuns.activeRunIds(credentials));
    }

    log.debug(`Run IDs to stop: ${runIdsToStop}`);

    try {
        await Stop.stopRemoteRuns(runIdsToStop, credentials);
    } catch (e) {
        logAndExit(e.message, e);
    }

    if (runIdsToStop.length > 0) {
        log.info(`SUCCESS: Stopped scenario. Remote run IDs stopped: ${runIdsToStop}`);
    } else {
        log.info('No active runs found by filters, nothing to stop.');
    }

    if (options['destroy']) {
        destroy(options);
    }
    log.debug('Stop completed successfully');
}

export async function stopRemoteRuns(runIds, credentials) {
    if (runIds.length === 0) {
        log.debug('Nothing to stop.');
        return;
    }

    for (const runId of runIds) {
        await Stop.sendStopRunRequest(runId, credentials);
    }
}

export async function sendStopRunRequest(runId, credentials) {
    log.debug(`Sending stop Run with id: ${runId} request`);

    const runPatchUrl = `${BrowserupUrl.browserupLoadUrl}/runs/${runId}`;

    try {
        const response = await axios.patch(runPatchUrl, null, {
            params: {api_token: credentials.api_token},
            headers: {accept: 'application/json'},
        });

        if (response.status >= 200 && response.status < 300) {
            log.debug(`Sent stop Run with id: ${runId} request successfully`);
        } else {
            throw new Error(`Unexpected response from WebConsole: ${response}`);
        }
    } catch (ex) {
        throw new StopRemoteRunError(ex);
    }
}

