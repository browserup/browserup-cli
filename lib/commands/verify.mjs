const RUN_MITMPROXY_SCRIPT_PATH = "/home/mitmproxy/.browserup-mitmproxy/start-proxy.sh"
const REQUEST_HAR_CMD = "curl localhost:48088/har"
const REQUEST_HEALTHCHECK_CMD = "curl localhost:48088/healthcheck"
const BROWSERUP_DEFAULT_IMAGE = "browserup/standard:latest"
const BROWSERUP_ARTIFACT_DIR = "/home/browserup/artifact/"

import path from "path";
import { DockerClient } from "../services/docker_client.mjs";
import retry from 'async-await-retry';
import fs from 'fs';
import { DataBanksLoader } from "../services/databanks_loader.mjs";
import { RepositoryAndTag } from "../models/repository_and_tag.mjs";
import { ErrorType, decoratedError } from "../browserup_errors.mjs";

export async function verify(command, args, programOpts) {
    log.info(`Running Verify for command: ${command}`);
    if (command == undefined || command.length == 0){
        throw decoratedError({msg: 'Command to verify not specified!',  type: ErrorType.INVALID_COMMAND});
    }

    const result = parseVerifyOptions(args);
    const artifactPath = result.artifactDir ? path.resolve(result.artifactDir) : process.cwd();
    await DockerClient.checkDockerAvailability();
    log.debug("Verify completed successfully");
    return verifyInternal(result.repoAndTag, result.databank, command, artifactPath, programOpts.verbose);
}

export async function verifyInternal(repoAndTag, databank, command, artifactDir, verbose = false) {
    try {
        let envs = null;
        var startedContainerId = null;
        if (databank !== null) {
            envs = this.databankToEnvs(databank);
        }
        log.debug("starting container proxy");
        startedContainerId = await DockerClient.startContainer(
            RUN_MITMPROXY_SCRIPT_PATH,
            repoAndTag.toString(),
            true,
            true,
            envs
        );

        const status = await retry(async () => {
            log.debug("copying files");
            return await DockerClient.copyIntoContainer(startedContainerId, `${artifactDir}/.`, `${BROWSERUP_ARTIFACT_DIR}`,
                "root:root");
        }, {maxTries: 1, delay: 0, timeout: 10000});
        log.debug("waiting for proxy");
        await waitForProxy({container_id: startedContainerId});
        log.debug(`execing command: ${command} in container id ${startedContainerId}`);
        await DockerClient.execInContainer(command, startedContainerId, true);

        //const [out, har] = await DockerClient.execInContainer(REQUEST_HAR_CMD, startedContainerId);

        const res = await DockerClient.execInContainer(REQUEST_HAR_CMD, startedContainerId);
        let har = res.stdout;
        let out = res.stderr;

        if (verbose) {
            log.info(`-- Stdout -- \n ${out.join("\n")} \n------------`);
            log.info("Captured HAR:\n");
            log.info(JSON.stringify(har[0], null, '\t'));
        }
        const harData = Array.isArray(har) ? har[0] : har;
        validateHar(harData);
        const result = JSON.parse(harData);
        const entries = result?.log?.entries;

        if (entries && entries.length > 0) {
            const urls = entries.map(entry => `${entry?.request?.method}: ${entry?.request?.url}`);
            log.info(urls.join("\n"));
        }
    } finally {
     //   if (startedContainerId != undefined) {
     //       await DockerClient.stopContainer({container_id: startedContainerId, force: true});
     //   }
    }
}

export function parseVerifyOptions(options) {
    const image = options.image || BROWSERUP_DEFAULT_IMAGE;
    const repoAndTag = new RepositoryAndTag(image);
    const showHar = options.showHar;
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
            databank = DataBanksLoader.loadFile(
                databankFile,
                { headers: true },
                { entriesRequired: true }
            );
        } catch (e) {
            console.error(`Invalid databank file provided: ${e.message}`);
            throw e;
        }
    }
    return {repoAndTag: repoAndTag, databank: databank, artifactDir: artifactDir};
}

export function databankToEnvs(databank) {
    const envs = {};
    for (const h of databank.headers) {
        envs[h] = databank[h][0];
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
    await retry(async () => {
        try {
            await DockerClient.execInContainer(REQUEST_HEALTHCHECK_CMD, opts.container_id, opts.privileged);
        } catch (e) {
            throw decoratedError(e.message);
        }
    }, {maxTries: 10, delay: 1000, timeout: 10000});
    log.info("Proxy is available");
}
