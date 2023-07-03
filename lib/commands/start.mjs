import {ConfigRepository} from "../services/config_repository.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {TarFileGenerator} from "../services/tar_file_generator.mjs";
import {createReadStream, existsSync} from "fs";
import {LocalEnvVars} from "../utils/local_env_vars.mjs";
import {deploy} from "./deploy.mjs";
import {destroy} from "./destroy.mjs";
import path from "path";
import {uploadScenario} from "./upload-scenario.mjs";
import {decoratedError, ErrorType} from "../browserup_errors.mjs";
import {WebConsoleClient} from "../services/webconsole_client.mjs";
import {calculateSHA256Hash} from "../utils/hash_utils.mjs";
import FormData from "form-data";

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

    log.info("Creating and running scenario...");
    const remoteRunId = await uploadAndRun(credentials.apiToken, config)

    LocalEnvVars.setSecret("lastRunId", remoteRunId);
    log.info(`SUCCESS: Started Run ID: ${remoteRunId}`);
    log.info(`Default user is: superadmin password: changeme! webconsole URL: ${credentials.clusterUrl}`);
    return remoteRunId;
}

async function uploadAndRun(apiToken, config) {
    const scenarioName = config.model.scenario.name;
    log.debug(`Upload scenario: ${scenarioName}`);
    const scenario = config.model.scenario;
    await uploadArtifacts(apiToken, scenario, path.dirname(config.configPath));
    const uploadedScenario = await uploadScenario(scenario, apiToken, config);
    log.debug(`Uploaded scenario "${scenarioName}" successfully, running...`);
    return await runUploadedScenario(uploadedScenario.id, apiToken);

}

async function runUploadedScenario(uploadedScenarioId, apiToken) {
    log.debug(`Running uploaded scenario: ${uploadedScenarioId}`);
    log.debug(`Using API token: ${apiToken}`);

    try {
        const response = await WebConsoleClient.sendPostRequest({
            path: `load/runs`,
            qParams: {
                scenario_id: uploadedScenarioId,
                api_token: apiToken
            }
        })
        return response.data.id
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
    return await TarFileGenerator.packTarTgz(dir);
}

async function uploadArtifacts(apiToken, scenario, workingDir) {
    for (const profile of scenario.profiles) {
        if (profile.artifactDir) {
            const artifactDir = path.join(workingDir, profile.artifactDir);
            profile.artifactSha = await uploadArtifactIfNeeded(apiToken, artifactDir);
        }
    }
}

async function uploadArtifactIfNeeded(apiToken, artifactDir) {
    const zippedFilepath = await zipArtifactDir(artifactDir);
    const sha256 = await calculateSHA256Hash(zippedFilepath)
    const alreadyUploaded = await getArtifactStatus(apiToken, artifactDir, sha256);
    return alreadyUploaded ? sha256 : await uploadArtifact(apiToken, zippedFilepath, artifactDir, sha256);
}

async function uploadArtifact(apiToken, zippedFilepath, artifactDir, sha256) {
    log.info(`Uploading artifact for ${artifactDir} with sha ${sha256}`);

    const data = new FormData();
    data.append("customer_artifact", createReadStream(zippedFilepath));

    try {
        await WebConsoleClient.sendPutRequest({
            path: `load/customer_artifacts/${sha256}`,
            qParams: {
                sha256: sha256,
                api_token: apiToken
            },
            extraHeaders: data.getHeaders(),
            data: data,
            expectedCodes: [200, 201]
        })
        return sha256;
    } catch (e) {
        log.error(e.message);
        throw decoratedError({msg: 'Error uploading artifact', error: e, type: ErrorType.UPLOAD_CUSTOMER_ARTIFACT});
    }
}

async function getArtifactStatus(apiToken, artifactDir, sha) {
    log.debug(`Getting artifact status of ${artifactDir} with sha ${sha}`);
    try {
        const response = await WebConsoleClient.sendGetRequest({
            path: `load/customer_artifacts/${sha}`,
            qParams: {api_token: apiToken},
            expectedCodes: [200, 404]
        })
        switch (response.status) {
            case 200:
                return true;
            case 404:
                return false;
            case 401:
                return false;
            default:
                throw decoratedError(`Error getting artifact status: ${response.statusText}`);
        }
    } catch (e) {
        throw decoratedError({
            msg: `Failed to get artifact status of ${artifactDir} with sha ${sha}`,
            error: e,
            type: ErrorType.GET_CUSTOMER_ARTIFACT_STATUS
        });
    }
}

