const RUN_MITMPROXY_SCRIPT_PATH = '/home/mitmproxy/.browserup-mitmproxy/start-proxy.sh'
const REQUEST_HAR_CMD = 'curl localhost:48088/har'
const REQUEST_HEALTHCHECK_CMD = 'curl localhost:48088/healthcheck'
const BROWSERUP_DEFAULT_IMAGE = 'browserup/standard:latest'
const BROWSERUP_ARTIFACT_DIR = '/home/browserup/artifact/'

import path from 'path';
import { DockerClient } from '../services/docker_client.mjs';
import {DataBanksLoader} from "../services/databanks_loader.mjs";

import 'async-await-retry';

export async function verify(command, options) {
    log.debug('Running Verify');
    const [repoAndTag, databank, artifact_dir] = this.parseVerifyOptions(options);
    const artifactPath = artifact_dir ? path.resolve(artifact_dir) : process.cwd();
    await DockerClient.check_docker_availability();
    log.debug('Verify completed successfully');
    return this.verifyInternal(repoAndTag, databank, command, artifactPath, options.verbose);
}

export async function verifyInternal(repoAndTag, databank, command, artifact_dir, verbose = false) {
    let envs = null;
    if (databank !== null) {
        envs = this.databank_to_envs(databank);
    }
    log.debug('starting container proxy');
    const started_container_id = await DockerClient.start_container({
        entrypoint: RUN_MITMPROXY_SCRIPT_PATH,
        repoAndTag: repoAndTag.toString(),
        daemonize: true,
        privileged: true,
        envs,
    });

    try {
        try {
            const status = await retry(async () => {
                log.debug('copying files');
                return DockerClient.copy_into_container({
                    container_id: started_container_id,
                    src: `${artifact_dir}/.`,
                    dest: `${BROWSERUP_ARTIFACT_DIR}`,
                    gid_uid: 'root:root',
                });
            }, {maxTries: 1, delay: 0, timeout: 10000});
            log.debug('waiting for proxy');
            await this.waitForProxy({container_id: started_container_id});
            log.debug(`execing command: ${command} in container id ${started_container_id}`);
            await DockerClient.exec_in_container({cmd: command, container_id: started_container_id});
        } catch (error) {
            const msg = `Failed to run image command, ${error.message}`;
            throw new Error(msg);
        }

        const [out, har] = await DockerClient.exec_in_container({
            cmd: REQUEST_HAR_CMD,
            container_id: started_container_id,
        });

        if (verbose) {
            log.info(`-- Stdout -- \n ${out.join('\n')} \n------------`);
            log.info('Captured HAR:\n');
            log.info(JSON.parse(har[0]));
        }
        const harData = Array.isArray(har) ? har[0] : har;
        this.validateHar(harData);
        const result = JSON.parse(harData);
        const entries = result?.log?.entries;

        if (entries && entries.length > 0) {
            const urls = entries.map(entry => `${entry?.request?.method}: ${entry?.request?.url}`);
            log.info(urls.join('\n'));
        }
    } catch (error) {
        throw error;
    } finally {
        await DockerClient.stop_container({container_id: started_container_id, force: true});
    }
}

export async function waitForProxy({container_id}) {
    log.info('Waiting for proxy to be available...');
    await retry(async () => {
        try {
            await DockerClient.exec_in_container({cmd: REQUEST_HEALTHCHECK_CMD, container_id});
        } catch (ex) {
            throw new Error(ex.message);
        }
    }, {maxTries: 10, delay: 1000, timeout: 10000});
    log.info('Proxy is available');
}
