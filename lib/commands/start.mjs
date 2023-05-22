import {ConfigRepository} from "../services/config_repository.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ClusterCredentials} from "../models/cluster_credentials.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {TarFileGenerator} from "../services/tar_file_generator.mjs";
import {createReadStream} from "fs";
import {createWriteStream} from "fs";
import {existsSync} from "fs";
import crypto from "crypto";
import axios from "axios";
import {LocalEnvVars} from "../utils/local_env_vars.mjs";
import {deploy} from "./deploy.mjs";
import {destroy} from "./destroy.mjs";
import {BrowserUpUrl} from "../utils/browserup_url.mjs";
import path from "path";
import {uploadScenario} from "./upload_scenario.mjs";
import {WAIT_FOR_BUILD_AND_UPLOAD_TIMEOUT} from "../constants.mjs";
import {ErrorType, decoratedError, BrowserUpError} from "../browserup_errors.mjs";

export async function start(options, programOpts) {
    log.info("Running Start");
    const configRepo = new ConfigRepository(programOpts.config);
    const scenarioName = configRepo.config.scenario.name;
    const config = configRepo.config;

    log.info(`Starting scenario ${scenarioName}...`);

    let credentials;
    if (options.redeploy) {
        await destroy(options);
    }

    if (options.deploy || options.redeploy) {
        credentials = await deploy(options);
    } else {
        log.debug("Deploying disabled, skipping deploy.");
        credentials = ClusterCredentialsRepository.getCredentials(
            options,
            ["apiToken", "clusterUrl"]);
    }

    ExistingClusterValidator.validate(credentials);

    const apiToken = credentials.apiToken;
    log.info("Creating and running scenario...");
    const remoteRunId = await uploadAndRun(apiToken, config)
    LocalEnvVars.setSecret("lastRunId", remoteRunId);
    log.info(`SUCCESS: Started Run ID: ${remoteRunId}`);
    log.info(`Default user is: superadmin password: changeme! webconsole URL: ${credentials.clusterUrl}`);
    return remoteRunId;
}

async function uploadAndRun(apiToken, config) {
    const scenarioName = config.model.scenario.name;
    log.debug(`Upload scenario: ${scenarioName}`);
    const scenario = config.model.scenario;
    await uploadArtifacts(apiToken, scenario, config.workingDir);
    const uploadedScenario = await uploadScenario(scenario, apiToken, config);
    log.debug(`Uploaded scenario "${scenarioName}" successfully, running...`);
    let result = await runUploadedScenario(uploadedScenario.id, apiToken);
    return result;

}


async function runUploadedScenario(uploadedScenarioId, apiToken) {
    log.debug(`Running uploaded scenario: ${uploadedScenarioId}`);
    const url = `${BrowserupUrl.browserupLoadUrl()}/runs`;
    try {
        const response = axios.post(url, null, {
            headers: {
                "apiToken": apiToken,
                "scenarioId": uploadedScenarioId,
                "Accept": "application/json",
            },
        });

        if (response.status === 200) {
            const run = response.data;
            return run.id;
        } else {
            throw decoratedError(`Unexpected response from WebConsole: ${response.statusText}`);
        }
    } catch (e) {
        throw decoratedError({msg: `Failed to start run`, error: e, type: ErrorType.START_RUN});
    }
}

async function zipArtifactDir(artifactDirStr) {
    const dir = path.join(artifactDirStr);
    if (!existsSync(dir)) {
        throw decoratedError(`Directory doesn't exist at: ${dir}`);
    }
    log.info(`Zipping image directory: ${dir}`);
    const outputFile = `${dir}.tar.gz`;
    TarFileGenerator.packTarTgz(dir, outputFile);
    return outputFile;
}

async function uploadArtifacts(apiToken, scenario, workingDir) {
    const uploaded = {};
    for (const profile of scenario.profiles) {
        if (profile.artifactDir) {
            const artifactDir = path.join(process.cwd(), profile.artifactDir);
            const artifactSha = await uploadArtifactIfNeeded(apiToken, artifactDir);
            profile.artifactSha = artifactSha.toString();
        }
    }
}

async function uploadArtifactIfNeeded(apiToken, artifactDir) {
    const zippedFilepath = zipArtifactDir(artifactDir);
    const sha256 = crypto.createHash("sha256").update(createReadStream(zippedFilepath)).digest("hex");
    const alreadyUploaded = await getArtifactStatus(apiToken, artifactDir, sha256);
    return alreadyUploaded ? sha256 : await uploadArtifact(apiToken, zippedFilepath, artifactDir, sha256);
}

async function uploadArtifact(apiToken, zippedFilepath, artifactDir, sha256) {
    log.info(`Uploading artifact for ${artifactDir} with sha ${sha256}`);
    const url = `${BrowserUpUrl.browserupLoadUrl()}/customer_artifacts/${sha256}`;
    const formData = new FormData();
    formData.append("customerArtifact", createReadStream(zippedFilepath));
    try {
        const response = axios.put(url, formData, {
            headers: {
                "apiToken": apiToken,
                "sha256": sha256,
                ...formData.getHeaders(),
            },
            timeout: WAIT_FOR_BUILD_AND_UPLOAD_TIMEOUT,
        });

        if (response.status === 200) {
            return sha256;
        } else {
            throw decoratedError(`Error uploading artifact: ${response.statusText}`);
        }
    } catch (e) {
        log.error(e.message);
        throw decoratedError({error: e, type: ErrorType.UPLOAD_CUSTOMER_ARTIFACT});
    }
}

async function getArtifactStatus(apiToken, artifactDir, sha) {
    log.debug(`Getting artifact status of ${artifactDir} with sha ${sha}`);
    const url = `${BrowserUpUrl.browserupLoadUrl()}/customer_artifacts/${sha}`;
    try {
        const response = axios.get(url, {
            headers: {
                "apiToken": apiToken,
                "Accept": "application/json",
            },
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 404) {
            return false;
        } else {
            throw decoratedError(`Error getting artifact status: ${response.statusText}`);
        }
    } catch (e) {
        throw decoratedError({
            msg: `Failed to create or update report: ${reportName}`,
            error: e,
            type: ErrorType.GET_CUSTOMER_ARTIFACT_STATUS
        });
    }
}

