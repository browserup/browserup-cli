import {exec} from "child_process";
import {promisify} from "util";
import fs from "fs";
import chalk from "chalk";
import dockerCompose from "docker-compose";

const execAsync = promisify(exec);

export class DockerClient {
    static async checkDockerAvailability() {
        try {
            await execAsync("docker --version");
        } catch (error) {
            throw new Error(`Docker is not available.\n>> ${error.stderr}`);
        }
    }

    static async buildImage({dockerfile, ctxPath, repoAndTag}) {
        try {
            await execAsync(`docker build ${ctxPath} -f ${dockerfile} -t ${repoAndTag}`);
            return repoAndTag;
        } catch (error) {
            throw new Error(`Failed to build image.\n>> ${error.stderr}`);
        }
    }

    static async inspectImage(repoAndTag) {
        try {
            const {stdout} = await execAsync(`docker inspect ${repoAndTag}`);
            const parsedOutput = JSON.parse(stdout);
            return parsedOutput[0];
        } catch (error) {
            throw new Error(`Failed to inspect image.\n>> ${error.stderr}`);
        }
    }

    static async startContainer({entrypoint, repoAndTag, privileged, daemonize, envs}) {
        let cmd = "docker run";
        cmd += daemonize ? " -d" : "";
        cmd += privileged ? " --privileged --cap-add SYS_ADMIN" : "";

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
            const {stdout} = await execAsync(cmd);
            const containerId = stdout.trim();
            if (!containerId) {
                throw new Error("Unexpected output, started container id is empty");
            }
            return containerId;
        } catch (error) {
            throw new Error(`Failed to start image. ${error.stderr}`);
        }
    }

    static async stopContainer({containerId, force}) {
        const stopCmd = force ? "kill" : "stop";
        try {
            await execAsync(`docker ${stopCmd} ${containerId}`);
        } catch (error) {
            throw new Error(`Failed to stop image.\n>> ${error.stderr}`);
        }
    }

    static async copyIntoContainer({containerId, src, dest, gidUid}) {
        gidUid ||= "root:root";
        try {
            await execAsync(`docker cp ${src} ${containerId}:${dest}`);
        } catch (error) {
            throw new Error(`Failed to copy ${src} to ${dest} in container ${containerId}:\n>> ${error.stderr}`);
        }
    }

    static async execInContainer({cmd, containerId, privileged}) {
        let dockerCommand = "docker exec";
        dockerCommand += privileged ? " --privileged" : "";

        const command = `${dockerCommand} ${containerId} ${cmd}`;

        try {
            await execAsync(command);
        } catch (error) {
            throw new Error(`Failed to exec cmd in container:\n>> ${error.stderr}`);
        }
    }

    static async dockerComposeUp({services, dockerComposePath, env}) {
        if (services.length === 0) {
            log.warn("No services provided for "docker-compose up", nothing to do");
            return;
        }

        if (!fs.existsSync(dockerComposePath)) {
            throw new Error(`Provided docker-compose file doesn"t exist by path: "${dockerComposePath}"`);
        }

        await dockerCompose.upAll({
            cwd: dockerComposePath,
            config: "docker-compose.yml",
            services,
            env
        });
    }

    static async dockerComposePull({dockerComposePath, services}) {
        if (!fs.existsSync(dockerComposePath)) {
            throw new Error(`Provided docker-compose file doesn"t exist by path: "${dockerComposePath}"`);
        }

        await dockerCompose.pullAll({
            cwd: dockerComposePath,
            config: "docker-compose.yml",
            services
        });
    }

    static async getContainerIds(containerNameFilter) {
        const cmd = `docker ps --filter "name=${containerNameFilter}" -aq`;
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(`Failed to get minion containers ids: \n>> ${stderr}`);
                } else {
                    resolve(stdout.split("\n").filter(id => id));
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
        } catch (error) {
            if (error.message.includes("DockerNotRunning")) {
                log.info("\nLocal Docker " + chalk.red("-"));
            } else if (error.message.includes("DockerNotInstalled")) {
                log.info("\nLocal Docker " + chalk.yellow("Not Present"));
            } else {
                throw error;
            }
        }
    }

    static async dockerInfo() {
        const cmd = "docker info --format="{{json .}}"";
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    if (stderr.includes("command not found")) {
                        reject(new Error("DockerNotInstalled"));
                    } else {
                        reject(new Error("DockerNotRunning"));
                    }
                } else {
                    const info = JSON.parse(stdout);
                    if (!info.ServerErrors) {
                        resolve(info);
                    } else {
                        reject(new Error(`DockerNotRunning: ServerErrors ${info.ServerErrors}`));
                    }
                }
            });
        });
    }

    static async stopMinions() {
        await this.stopAndRemoveContainers("browserup_minion");
    }

    static async stopUserContainers() {
        await this.stopAndRemoveContainers("browserup_vu");
    }

    static async stopAndRemoveContainers(containerNameFilter) {
        const minionsContainersIds = await this.getContainerIds(containerNameFilter);
        if (minionsContainersIds.length === 0) {
            return;
        }

        const cmd = `docker stop ${minionsContainersIds.join(" ")};`;
        try {
            await execAsync(cmd);
        } catch (errors) {
            throw new Error(`Failed to stop minion containers: \n>> ${errors.join(">> ")}`);
        }

        const cmd2 = `docker rm ${minionsContainersIds.join(" ")};`;
        try {
            await execAsync(cmd2);
        } catch (errors) {
            throw new Error(`Failed to remove minion containers: \n>> ${errors.join(">> ")}`);
        }
    }

    static async dockerComposeRm(dockerComposePath, env) {
        if (!existsSync(dockerComposePath)) {
            throw new Error(`Provided docker-compose file doesn"t exist by path: "${dockerComposePath}"`);
        }
        const cmd = `docker-compose -f "${dockerComposePath}" rm`;
        try {
            await execAsync(cmd, {env});
        } catch (errors) {
            throw new Error(`Failed to run "docker-compose rm": \n>> ${errors.join(">> ")}`);
        }
    }

    static async dockerComposeDown(dockerComposePath, removeVolumes = false, env) {
        if (!existsSync(dockerComposePath)) {
            throw new Error(`Provided docker-compose file doesn"t exist by path: "${dockerComposePath}"`);
        }
        await this.stopMinions();
        await this.stopUserContainers();

        let cmd = `docker-compose -f "${dockerComposePath}" down `;
        if (removeVolumes) {
            cmd += " -v ";
        }
        try {
            await execAsync(cmd, {env});
        } catch (errors) {
            throw new Error(`Failed to run "docker-compose down": \n>> ${errors.join(">> ")}`);
        }
    }
}

export default DockerClient;


