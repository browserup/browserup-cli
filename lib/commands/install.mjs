import  {DockerClient} from "../services/docker_client.mjs";
import semver from 'semver'; // Use semver for comparing versions
import { BrowserUpPaths} from "../utils/browserup_paths.mjs";
import { copyFilesToDotFolderIfMissing } from "../utils/docker.mjs";
import chalk from "chalk";
const MINIMUM_DOCKER_VERSION= "19.0.0"

export async function install(){
    if(!process.env.SKIP_DOCKER){
     log.info("Checking Docker version...");
        checkDockerVersion();
        copyFilesToDotFolderIfMissing();
        await pullDockerImages();
    }
    displayWelcome();
}

async function checkDockerVersion(){
    const result = await DockerClient.execCommand('docker --version', { silent: true });
    const installedVersion = result.stdout.join(`\n`).match(/Docker version (\d+\.\d+\.\d+)/)[1];

    log.info("Docker version: " + installedVersion);
    if (result.exitCode !== 0) {
        log.info("Docker not found. Download and install from https://docs.docker.com/get-docker/");
        log.info('Alternatively, if this is a docker-less install that will only use AWS for runs, perhaps for CI/CD');
        log.info('then you can run:  SKIP_DOCKER=true node install browserup');
        log.info('If you install docker later, you can run:  browserup cluster install');
        log.info('This is not strictly necessary, but it will verify your installation');
        process.exit(1);
    }

    if (semver.lt(installedVersion, MINIMUM_DOCKER_VERSION)) {
        log.warn(`Your Docker version is less than the minimum required version (${MINIMUM_DOCKER_VERSION}). Please update Docker.`);
        process.exit(1);
    }

    log.info("Docker found with compatible version");
}

async function pullDockerImages() {
    log.debug("Looking for yaml at: " + BrowserUpPaths.dockerComposeYmlPath());
    log.info("Starting background pull of Docker images...");
    await DockerClient.dockerComposePull(
        {dockerComposePath: BrowserUpPaths.dockerComposeYmlPath(), services:   '', background: true});
}

function displayWelcome(){
    const browserup = chalk.hex("#de792b")("Browser") + chalk.hex("#3a3a3a")("Up ")
    const banner = `
${browserup}, the DRY (don't repeat yourself) load testing tool.

${chalk.green('Getting Started')}

 mkdir demo && cd demo

Init a config (and sample script unless you have one)

  browserup load init -e playwright-js

Launch the cluster, and start the test

  browserup load start

To view the test, visit http://localhost:6730/
username: superadmin
password: ChangeMe!

Click on Reports -> Summary in the left sidebar
Select the Run in the top drop-down and check the summary report.
Stop the test:
 browserup load stop
 
 Local Requirements
- Docker Installed and Running
- 32 GB+ Ram Recommended

Cloud Requirements
- Amazon AWS account
- Local Docker is optional for AWS execution, so CI/CD setup is simple
- For large runs, contact AWS to increase your VCPU limit:
  https://repost.aws/knowledge-center/ec2-on-demand-instance-vcpu-increases
Documentation: https://browserup.github.io/docs

  `;
    log.info(banner);
}
