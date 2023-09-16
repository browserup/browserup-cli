import fs from 'fs';
import chalk from 'chalk';
import os from 'os';
import {exec as execCb, spawn} from 'child_process';
import { promisify } from 'util';
import {ErrorType, decoratedError} from "../browserup_errors.mjs";

const exec = promisify(execCb);


export class DockerClient {
    static dockerComposeExecutable = undefined

    static async getDockerComposeExecutable() {
        if (this.dockerComposeExecutable === undefined) {
            this.dockerComposeExecutable = await this.getWorkingDockerComposeExecutable()
        }
        return this.dockerComposeExecutable
    }

    static async checkDockerAvailability() {
        log.debug("Checking docker availability")
        let result = await this.execCommand('docker --version');
        if (result.exitCode === 0) {
            log.debug("Docker is available")
        } else {
            throw decoratedError(`Docker is not available: '${result.stderr}'`);
        }
    }

    /**
     * On user's system docker-compose can be either old 'docker-compose' or new 'docker compose'.
     * @returns {Promise<string>} command to run docker compose or throws error
     */
    static async getWorkingDockerComposeExecutable() {
        try {
            await this.checkDockerComposeAvailability('docker compose version')
            log.debug('Docker compose is available')
            return 'docker compose'
        } catch (e) {
            log.debug('New version of docker compose is not available, checking legacy...')
        }
        try {
            await this.checkDockerComposeAvailability('docker-compose --version')
            log.debug('Legacy docker-compose is available, using it')
            return 'docker-compose'
        } catch (e) {
            throw decoratedError(`Docker compose is not available`);
        }
    }

    static async checkAnyDockerComposeAvailability() {
        DockerClient.dockerComposeExecutable = await this.getWorkingDockerComposeExecutable()
    }

    static async checkDockerComposeAvailability(command) {
        log.debug("Checking docker-compose availability")
        let result = await this.execCommand(command);
        if (result.exitCode === 0) {
            log.debug(`Docker-compose is available (via command: '${command}')`)
        } else {
            throw decoratedError(`Docker-compose is not available: '${result.stderr}'`);
        }
    }

    static async execCommand(command, envs = {}) {
        let stdout = '';
        let stderr = '';
        let exitCode = 0;
        try {
            const allEnvs = { ...envs, ...process.env, PATH: process.env.PATH }
            let options = { env: allEnvs, shell: true };
            let result = await exec(command, options);
            stdout = result.stdout;
            stderr = result.stderr;
        } catch (e) {
            log.debug(e);
            // if the command execution failed, error object will contain the exit code, stdout and stderr
            stdout = e.stdout;
            stderr = e.stderr;
            exitCode = e.code;
        }
        let stdoutLines = stdout ? stdout.split(/\r?\n/) : [];
        let stderrLines = stderr ? stderr.split(/\r?\n/) : [];
        return { exitCode: exitCode, stdout: stdoutLines, stderr: stderrLines };
    }


    static async buildImage(dockerfile, ctxPath, repoAndTag) {
        try {
            await this.execCommand(`docker build ${ctxPath} -f ${dockerfile} -t ${repoAndTag}`);
            return repoAndTag;
        } catch (e) {
            throw decoratedError(`Failed to build image.\n>> ${e.stderr}`);
        }
    }

    // if we want to use this container for future debugging, we can commit the current state of the file system
    static async commitContainer(containerId, newContainername) {
        log.info(`Committing container ${containerId} as ${newContainername}`);
        const result = await this.execCommand(`docker commit ${containerId} ${newContainername}`);
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

    static async startContainer(entrypoint, repoAndTag, privileged, daemonize, envs, portBindings) {
        let cmd = 'docker run';
        cmd += daemonize ? ' -d' : '';
        cmd += privileged ? ' --privileged --cap-add SYS_ADMIN' : '';
        cmd += portBindings ? ` -p ${portBindings}` : ''

        if (entrypoint) {
            cmd += ` --entrypoint "${entrypoint}"`;
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

    static async stopContainer({containerId, force}) {
        log.info(`Stopping container ${containerId}`);
        const stopCmd = force ? 'kill' : 'stop';
        try {
            await this.execCommand(`docker ${stopCmd} ${containerId}`);
        } catch (e) {
            throw decoratedError(`Failed to stop image.\n>> ${e.stderr}`);
        }
    }

    static async copyIntoContainer(containerId, src, dest) {
        try {
            await this.execCommand(`docker cp ${src} ${containerId}:${dest}`);
        } catch (e) {
            throw decoratedError(`Failed to copy ${src} to ${dest} in container ${containerId}:\n>> ${e.stderr}`);
        }
    }

    static async copyFromContainer(containerId, src, dest) {
        try {
            await this.execCommand(`docker cp ${containerId}:${src} ${dest}`);
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
        log.debug(`Docker command stdout: ${(await result).stdout.join('\n')}`);
        log.debug(`Docker command stderr: ${(await result).stderr.join('\n')}`);
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

        const cmd = `${await DockerClient.getDockerComposeExecutable()} -f "${dockerComposePath}" up -d ${services.join(' ')}`;
        const result = await this.execCommand(cmd, envs);

        if (result.exitCode !== 0) {
            throw decoratedError(`Failed to run 'docker-compose up': \n>> ${result.stderr.join(">> ")}`);
        }
    }


    static async dockerPull({imageNameAndTag, background = false}) {
        const cmd = `docker pull "${imageNameAndTag}"`;
        log.debug(`Running command: ${cmd}`);
        let result = null;
        if(background) {
            // fire and forget
            this.execBackgroundCommand(cmd);
            return;
        } else {
            result = await this.execCommand(cmd);
        }
        if (result.exitCode !== 0) {
            throw decoratedError(`Failed to run '${cmd}': \n>> ${result.stderr.join(">> ")}`);
        }
    }

    static async dockerComposePull({dockerComposePath, services = '', background = false}) {
        if (!fs.existsSync(dockerComposePath)) {
            throw decoratedError(`Provided docker-compose file doesn't exist at path: '${dockerComposePath}'`);
        }

        const cmd = `${await DockerClient.getDockerComposeExecutable()} -f "${dockerComposePath}" pull ${services}`;
        log.debug(`Running command: ${cmd}`);
        let result = null;
        if(background) {
            // fire and forget
            this.execBackgroundCommand(cmd);
            return;
        } else {
            result = await this.execCommand(cmd);
        }
        if (result.exitCode !== 0) {
            throw decoratedError(`Failed to run 'docker-compose pull': \n>> ${result.stderr.join(">> ")}`);
        }
    }

    // Fires a command and forgets about it. This is used, for example, if we want to kick off a background
    // pull of the latest docker images to give ourselves a head start on the next run.
    static execBackgroundCommand(cmd, args = []) {
        spawn(cmd, [], { shell: true, stdio: 'ignore', detached: true }).unref();
    }

    static async getContainerIds(containerNameFilter) {
        const cmd = `docker ps --filter "name=${containerNameFilter}" -aq`;
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(decoratedError(`Failed to get minion containers ids: \n>> ${stderr}`))
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
            await this.execCommand(cmd);
        } catch (e) {
            throw decoratedError({msg: `Failed to stop minion containers`, error: e});
        }

        const cmd2 = `docker rm ${minionsContainersIds.join(' ')};`;
        try {
            await this.execCommand(cmd2);
        } catch (errors) {
            throw decoratedError({msg: `Failed to remove minion containers`, error: e});
        }
    }

    static async dockerComposeRm( dockerComposePath, env ) {
        if (!fs.existsSync(dockerComposePath)) {
            throw decoratedError(`Provided docker-compose file doesn't exist at path: '${dockerComposePath}'`);
        }

        const cmd = `${await DockerClient.getDockerComposeExecutable()} -f "${dockerComposePath}" rm`;
        const result = await this.execCommand(cmd);

        if (result.exitCode !== 0) {
            throw decoratedError(`Failed to run 'docker-compose rm': \n>> ${result.stderr.join(">> ")}`);
        }
    }

    static async dockerComposeDown({dockerComposePath, removeVolumes = true, env}) {
        if (!fs.existsSync(dockerComposePath)) {
            throw decoratedError(`Provided docker-compose file doesn't exist at path: '${dockerComposePath}'`);
        }

        await this.stopMinions()
        await this.stopUserContainers()

        let cmd = `${await DockerClient.getDockerComposeExecutable()} -f "${dockerComposePath}" down`;
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




