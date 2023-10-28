import  {DockerClient} from "../services/docker_client.mjs";
import semver from 'semver'; // Use semver for comparing versions
import {BrowserUpPaths} from "../utils/browserup_paths.mjs";
import {copyFilesToDotFolderIfMissing} from "../utils/docker.mjs";
import chalk from "chalk";
import {BROWSERUP_DEFAULT_IMAGE} from "../constants.mjs";
const MINIMUM_DOCKER_VERSION= "19.0.0"

export async function install(){
    if(!process.env.SKIP_DOCKER){
        await checkDockerVersion();
        copyFilesToDotFolderIfMissing();
        await pullDockerImages();
    }
    displayWelcome();
}

async function checkDockerVersion(){
    const result = await DockerClient.execCommand('docker --version', { silent: true });
    let installedVersion = '';
    try {
         installedVersion = result.stdout.join("").match(/Docker version (\d+\.\d+\.\d+)/)[1];
    } catch (e) {
        log.info(e);
    }
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
}

async function pullDockerImages(background = false){
    log.debug("Looking for yaml at: " + BrowserUpPaths.dockerComposeYmlPath());
    log.info("Pulling Docker images -- this can take a several minutes!");
    
    await DockerClient.dockerPull({imageNameAndTag: BROWSERUP_DEFAULT_IMAGE, background: false});
    await DockerClient.dockerComposePull(
        {dockerComposePath: BrowserUpPaths.dockerComposeYmlPath(), services:   '', background: false});
}


function displayWelcome(){
    const browserup = chalk.hex("#de792b")("Browser") + chalk.hex("#3a3a3a")("Up ")
    const banner = `
${chalk.yellow('---------------------------------------- Quick Start -------------------------------------------')}

Make a folder and cd to it:

  ${chalk.blue('mkdir demo && cd demo')}

Create a config with an example test:

  ${chalk.blue('browserup load init --playwright-js')}

Launch the cluster and start the test:  

  ${chalk.blue('browserup load start')}

${chalk.green('View the Test:')}  http://localhost:23000

  ${chalk.green('username:')} superadmin 
  ${chalk.green('password:')} changeme!

${chalk.green('View the Report:')}

  ► Click on Reports -> Summary in the left sidebar
  ► Select the Run in the top drop-down

Stop the test:

  ${chalk.blue('browserup load stop')}

Destroy the cluster:

  ${chalk.blue('browserup cluster destroy')}
  
List all canned test examples:

  ${chalk.blue('browserup load init -h')}
 
${chalk.green('Local Run Requirements')}
  ° 32 GB+ Ram Recommended
  ° Docker Installed and Running

${chalk.green('Cloud Run Requirements')}
  ° Amazon AWS account
  ° Local Docker is optional for AWS-only execution
  ° For large runs, contact AWS to increase your VCPU limit:
    https://repost.aws/knowledge-center/ec2-on-demand-instance-vcpu-increases

${chalk.green('Help Command:')} ${chalk.blue('browserup help')}  

${chalk.green('Documentation:')} https://browserup.github.io/docs

${chalk.yellow('------------------------------------------------------------------------------------------------')}
  `;
    log.info(banner);
}
