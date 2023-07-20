import {WebConsoleClient} from "../services/webconsole_client.mjs";

const RUN_MITMPROXY_SCRIPT_PATH = "/home/mitmproxy/.browserup-mitmproxy/start-proxy.sh"
const REQUEST_HEALTHCHECK_CMD = "curl localhost:48088/healthcheck"
const BROWSERUP_ARTIFACT_DIR = "/home/browserup/artifact/"

import path from "path";
import { DockerClient } from "../services/docker_client.mjs";
import retry from 'async-await-retry';
import fs from 'fs';
import { DataBanksLoader } from "../services/databanks_loader.mjs";
import { RepositoryAndTag } from "../models/repository_and_tag.mjs";
import { ErrorType, decoratedError } from "../browserup_errors.mjs";
import {TokenGenerator} from "../utils/token_generator.mjs";
import {BROWSERUP_DEFAULT_IMAGE} from "../constants.mjs";
import {Retry} from "../utils/retry.mjs";

const WAIT_FOR_PROXY = {
    delaySec: 1, retries: 10, maxElapsedTimeSec: 10,
};

export async function verify(command, args, programOpts) {
    log.info(`Running Verify for command: ${command}`);
    if (command === undefined || command.length == 0){
        throw decoratedError({msg: 'Command to verify not specified!',  type: ErrorType.INVALID_COMMAND});
    }

    const result = await parseVerifyOptions(args);
    const artifactPath = result.artifactDir ? path.resolve(result.artifactDir) : null;
    await DockerClient.checkDockerAvailability();
    await verifyInternal(
        result.repoAndTag, result.databank, command,
        artifactPath, programOpts.verbose, args.keep, result.showHar);
    log.debug("Verify completed successfully");
}

async function prepareContainer(repoAndTag, envs, artifactDir) {
    log.debug(`Starting container proxy`);
    const startedContainerId = await DockerClient.startContainer(
        RUN_MITMPROXY_SCRIPT_PATH,
        repoAndTag.toString(),
        true,
        true,
        envs,
    );
    if (artifactDir !== null) {
        if (!fs.lstatSync(artifactDir).isDirectory()) {
            throw decoratedError(`Artifact directory doesn't exist by path '${artifactDir}'`)
        }
        log.debug(`Copying '${artifactDir}' to '${BROWSERUP_ARTIFACT_DIR}'...`)
        await DockerClient.copyIntoContainer(startedContainerId, `${artifactDir}/.`, `${BROWSERUP_ARTIFACT_DIR}`);
    }
    log.info(`Artifact is available by path: ${BROWSERUP_ARTIFACT_DIR}`)

    log.debug("Waiting for proxy");
    await waitForProxy({container_id: startedContainerId});

    return startedContainerId;
}

export async function verifyInternal(repoAndTag, databank, command, artifactDir, verbose = false, keep = false, showHar = false) {
    let startedContainerId;
    try {
        let envs = null;
        if (databank !== null) {
            envs = databankToEnvs(databank);
        }
        log.debug(`Using ENV variables: ${JSON.stringify(envs)}`)
        startedContainerId = await prepareContainer(repoAndTag, envs, artifactDir);
        if (keep) {
            const commitToName = `${repoAndTag.repository}-debug`;
            log.info(`Committing container to ${commitToName}`);
            await DockerClient.commitContainer(startedContainerId, commitToName);
        }

        log.debug(`Executing command: ${command} in container id ${startedContainerId}`);
        await DockerClient.execInContainer(command, startedContainerId, true);

        const tempHarOutputFilePath = `/tmp/${TokenGenerator.friendlyToken(5)}`
        const reqHarCmd = `curl localhost:48088/har -o ${tempHarOutputFilePath}`
        await DockerClient.execInContainer(reqHarCmd, startedContainerId);
        await DockerClient.copyFromContainer(startedContainerId, tempHarOutputFilePath, tempHarOutputFilePath);
        const har = fs.readFileSync(tempHarOutputFilePath, 'utf8')

        if (verbose) {
            log.info("Captured HAR:\n");
            log.info(JSON.stringify(har, null, '\t'));
        }
        const harData = Array.isArray(har) ? har[0] : har;
        validateHar(harData);
        const result = JSON.parse(harData);
        const entries = result?.log?.entries;

        if (entries && entries.length > 0) {
            const urls = entries.map(entry => `${entry?.request?.method}: ${entry?.request?.url}`);
            log.info(urls.join("\n"));
        }

        if (showHar) {
            log.info("HAR:")
            log.info(harData)
        }
    } catch (e) {
        throw decoratedError({msg: 'Failed to verify', error: e})
    } finally {
       if (startedContainerId !== undefined) {
           await DockerClient.stopContainer({containerId: startedContainerId, force: true});
       }
    }
}

export async function parseVerifyOptions(options) {
    const image = options.image || BROWSERUP_DEFAULT_IMAGE;
    const repoAndTag = new RepositoryAndTag(image);
    const showHar = options.showHar === true;
    const artifactDir = options.artifactDir;
    const databankFile = options.databank;

    if (artifactDir && !fs.existsSync(artifactDir)) {
        const message = `artifactDir not found: ${artifactDir}`;
        console.error(message);
        throw decoratedError(message);
    }

    let databank = null;
    if (databankFile) {
        try {
            log.info(`Loading Databank file by path: ${databankFile}`);
            databank = await DataBanksLoader.loadFile(
                databankFile,
                { headers: true },
                { entriesRequired: true }
            );
        } catch (e) {
            console.error(`Invalid databank file provided: ${e.message}`);
            throw e;
        }
    }
    return {repoAndTag: repoAndTag, databank: databank, artifactDir: artifactDir, showHar: showHar};
}

export function databankToEnvs(databank) {
    const records = databank.records
    if (records.length < 2) {
        throw decoratedError("Expected databank to contain header line and at least one values line")
    }
    const envs = {};
    let columnIndex = 0;
    for (const h of records[0]) {
        envs[h] = records[1][columnIndex];
        columnIndex++;
    }
    return envs;
}

export function validateHar(harStr) {
    if (harStr === '') {
        throw decoratedError({msg: 'Empty HAR String', type: ErrorType.INVALID_HAR});
    }
    let parsedHar;
    try {
        parsedHar = JSON.parse(harStr);
    } catch (e) {
        throw decoratedError({msg: `Invalid HAR, parsing error: ${e.message}`, type: ErrorType.INVALID_HAR});
    }
    validateParsedHar(parsedHar);
}

export function validateParsedHar(har) {
    if (!har.log) {
        throw decoratedError({msg: 'Unexpected HAR format, log is empty', type: ErrorType.INVALID_HAR});
    }
    const harEntries = har.log.entries;
    if (!harEntries) {
        throw decoratedError({msg: 'Unexpected HAR format, log.entries is empty', type: ErrorType.INVALID_HAR});
    }
    if (!Array.isArray(harEntries)) {
        throw decoratedError({msg: 'Unexpected HAR format, log.entries has invalid format', type: ErrorType.INVALID_HAR});
    }
    if (harEntries.length === 0) {
        console.warn('The traffic capture (HAR) is present, but no entries are captured');
    } else {
        log.info(`The traffic capture (HAR) is valid, number of captured entries: ${harEntries.length}`);
    }
}

export async function waitForProxy(opts) {
    log.info("Waiting for proxy to be available...");
    await Retry.retry({
        waitStrategy: WAIT_FOR_PROXY,
        retryableErrorTypes: [ErrorType.PROXY_IS_NOT_READY],
        retryFunc: async () => {
            let result = undefined;
            try {
                result = await DockerClient.execInContainer(
                    REQUEST_HEALTHCHECK_CMD,
                    opts.container_id,
                    opts.privileged);
            } catch (e) {
                throw decoratedError({type: ErrorType.PROXY_IS_NOT_READY, msg: e.message});
            }
            if (result.exitCode !== 0) {
                throw decoratedError({
                    type: ErrorType.PROXY_IS_NOT_READY,
                    msg: `Expected exit code = 0, got '${result.exitCode}'`});
            }
        }
    })
    log.info("Proxy is available");
}
