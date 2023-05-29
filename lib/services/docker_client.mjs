import fs from 'fs';
import chalk from 'chalk';

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import {ErrorType, decoratedError} from "../browserup_errors.mjs";
import {execCommand} from "../utils/docker.mjs";

const exec = promisify(execCb);


export class DockerClient {
    static async checkDockerAvailability() {
        try {
            await this.execCommand('docker --version');
        } catch (e) {
            throw decoratedError(`Docker is not available.\n>> ${e.stderr}`);
        }
    }

    static async execCommand(command, envs = {}) {
        try {

            const { stdout, stderr } = await exec(command, { env: {...process.env, PATH: process.env.PATH} });

            log.info(`Working in path ${process.env.PATH}`);

            const exitCode = 0; // exit code is 0 if the command is successfully executed
            const stdoutLines = stdout.split('\n');
            const stderrLines = stderr ? stderr.split('\n') : [];

            return {
                exitCode,
                stdout: stdoutLines,
                stderr: stderrLines,
            };
        } catch (e) {
            // if the command execution failed, error object will contain the exit code, stdout and stderr
            const exitCode = e.code;
            const stdoutLines = e.stdout.split('\n');
            const stderrLines = e.stderr ? e.stderr.split('\n') : [];

            return {
                exitCode,
                stdout: stdoutLines,
                stderr: stderrLines,
            };
        }
    }


    static async buildImage(dockerfile, ctxPath, repoAndTag) {
        try {
            await this.execCommand(`docker build ${ctxPath} -f ${dockerfile} -t ${repoAndTag}`);
            return repoAndTag;
        } catch (e) {
            throw decoratedError(`Failed to build image.\n>> ${e.stderr}`);
        }
    }

    static async inspectImage(repoAndTag) {
        try {
            const result = await execCommand(`docker inspect ${repoAndTag}`);
            const parsedOutput = JSON.parse(result.stdout.join("\n"));
            return parsedOutput[0];
        } catch (e) {
            throw decoratedError(`Failed to inspect image.\n>> ${e.stderr}`);
        }
    }

    static async startContainer(entrypoint, repoAndTag, privileged, daemonize, envs) {
        let cmd = 'docker run';
        cmd += daemonize ? ' -d' : '';
        cmd += privileged ? ' --privileged --cap-add SYS_ADMIN' : '';

        if (entrypoint) {
            cmd += ` --entrypoint '${entrypoint}'`;
        }

        if (envs) {
            for (const [envName, envValue] of Object.entries(envs)) {
                cmd += ` --env ${envName}=${envValue}`;
            }
        }

        cmd += ` ${repoAndTag}`;

        try {
            const result = await this.execCommand(cmd);
            const containerId = result.stdout[0].trim();
            if (!containerId) {
                throw decoratedError('Unexpected output, started container id is empty');
            }
            return containerId;
        } catch (e) {
            throw decoratedError({error: e, msg: `Failed to start image.`, type: ErrorType.D});
        }
    }

    static async checkDockerComposeFileExists(dockerComposePath) {
        if (!fs.existsSync(dockerComposePath.toString())) {
            throw decoratedError(`Docker-compose file doesn't exist at path: ${dockerComposePath.toString()}`);
        }
    }

    static async stopContainer(containerId, force) {
        log.info(`stopping container ${containerId}`);
        const stopCmd = force ? 'kill' : 'stop';
        try {
            await this.execCommand(`docker ${stopCmd} ${containerId}`);
        } catch (e) {
            throw decoratedError(`Failed to stop image.\n>> ${e.stderr}`);
        }
    }

    static async copyIntoContainer(containerId, src, dest, gidUid) {
        gidUid ||= 'root:root';
        try {
            await this.execCommand(`docker cp ${src} ${containerId}:${dest}`);
        } catch (e) {
            throw decoratedError(`Failed to copy ${src} to ${dest} in container ${containerId}:\n>> ${e.stderr}`);
        }
    }

    static async execInContainer ( cmd, containerId, privileged = false )  {
        let dockerCommand = 'docker exec';
        if (privileged) {
            dockerCommand += ' --privileged ';
        }

        const command = `${dockerCommand} ${containerId} ${cmd}`;
        console.debug(`${command}`);
        let result = this.execCommand(command);
        return result;
    }

    static async dockerComposeUp(services, dockerComposePath, envs) {
        if (!services || services.length === 0) {
            console.warn("No services provided for 'docker-compose up', nothing to do");
            return;
        }

        if (!fs.existsSync(dockerComposePath)) {
            throw decoratedError(`Provided docker-compose file doesn't exist by path: '${dockerComposePath}'`);
        }

        const cmd = `docker-compose -f '${dockerComposePath}' up -d ${services.join(' ')}`;
        const result = await this.execCommand(cmd, envs);

        if (result.exitCode !== 0) {
            throw decoratedError(`Failed to run 'docker-compose up': \n>> ${result.stderr.join(">> ")}`);
        }
    }

    static async dockerComposePull( dockerComposePath, services = '' ) {
        if (!fs.existsSync(dockerComposePath)) {
            throw decoratedError(`Provided docker-compose file doesn't exist at path: '${dockerComposePath}'`);
        }

        const cmd = `docker-compose -f '${dockerComposePath}' pull ${services}`;
        const result = await this.execCommand(cmd);

        if (result.exitCode !== 0) {
            throw decoratedError(`Failed to run 'docker-compose pull': \n>> ${result.stderr.join(">> ")}`);
        }
    }

    static async getContainerIds(containerNameFilter) {
        const cmd = `docker ps --filter "name=${containerNameFilter}" -aq`;
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(`Failed to get minion containers ids: \n>> ${stderr}`);
                } else {
                    resolve(stdout.split('\n').filter(id => id));
                }
            });
        });
    }

    static localDockerStatusMessage() {
        return this.localDockerStatus();
    }

    static async localDockerStatus() {
        try {
            await this.dockerInfo();
            log.info("\nLocal Docker " + chalk.green("✓"));
        } catch (e) {
            if (e.message.includes("DockerNotRunning")) {
                log.info("\nLocal Docker " + chalk.red("-"));
            } else if (e.message.includes("DockerNotInstalled")) {
                log.info("\nLocal Docker " + chalk.yellow("Not Present"));
            } else {
                throw e;
            }
        }
    }

    static async dockerInfo() {
        const cmd = "docker info --format='{{json .}}'";
        const result = await this.execCommand(cmd);
    }

    static async stopMinions() {
        await this.stopAndRemoveContainers('browserup_minion');
    }

    static async stopUserContainers() {
        await this.stopAndRemoveContainers('browserup_vu');
    }

    static async stopAndRemoveContainers(containerNameFilter) {
        const minionsContainersIds = await this.getContainerIds(containerNameFilter);
        if (minionsContainersIds.length === 0) {
            return;
        }

        const cmd = `docker stop ${minionsContainersIds.join(' ')};`;
        try {
            await execCommand(cmd);
        } catch (errors) {
            throw decoratedError(`Failed to stop minion containers: \n>> ${errors.join('>> ')}`);
        }

        const cmd2 = `docker rm ${minionsContainersIds.join(' ')};`;
        try {
            await execCommand(cmd2);
        } catch (errors) {
            throw decoratedError(`Failed to remove minion containers: \n>> ${errors.join('>> ')}`);
        }
    }

    static async dockerComposeRm( dockerComposePath, env ) {
        if (!fs.existsSync(dockerComposePath)) {
            throw decoratedError(`Provided docker-compose file doesn't exist at path: '${dockerComposePath}'`);
        }

        const cmd = `docker-compose -f '${dockerComposePath}' rm`;
        const result = await this.execCommand(cmd);

        if (result.exitCode !== 0) {
            throw decoratedError(`Failed to run 'docker-compose rm': \n>> ${result.stderr.join(">> ")}`);
        }
    }

    static async dockerComposeDown( dockerComposePath, removeVolumes = false, env ) {
        if (!fs.existsSync(dockerComposePath)) {
            throw decoratedError(`Provided docker-compose file doesn't exist at path: '${dockerComposePath}'`);
        }

        let cmd = `docker-compose -f '${dockerComposePath}' down`;
        if (removeVolumes) {
            cmd += ' -v';
        }

        const result = await this.execCommand(cmd);

        if (result.exitCode !== 0) {
            let msg = `Failed to run 'docker-compose down': \n>> ${result.stderr.join(">> ")}`;
            msg += `\n Command Was: ${cmd}`;
            throw decoratedError({msg: msg, type: ErrorType.DOCKER_COMPOSE_COMMAND});
        }
    }
}

export default DockerClient;




