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
import {InvalidClusterCredentials, ClusterAlreadyExistsException} from "../exceptions.mjs";
import {deploy} from "./deploy.mjs";
import {destroy} from "./destroy.mjs";
import {BrowserUpUrl} from "../utils/browserup_url.mjs";

export async function start(options, program_opts) {
    log.debug("Running Start");
    const configRepo = new ConfigRepository(program_opts.config);
    const scenarioName = configRepo.config.scenario["name"];
    const config = configRepo.config;
    log.info(`Starting scenario ${scenarioName}...`);
    let credentials;
    if (options["redeploy"]) {
        credentials = await destroy(options);
    }

    if (options["deploy"] || options["redeploy"]) {
        credentials = await deploy(options);
    } else {
        log.debug("Deploying disabled, skipping deploy.");
        credentials = ClusterCredentialsRepository.getCredentials({
            options: options,
            requiredFields: ["api_token", "cluster_url"],
        });
    }

    ExistingClusterValidator.validate(credentials);
    const api_token = credentials.api_token;
    log.info("Creating and running scenario...");
    const remote_run_id = Start.uploadAndRun(api_token, config);
    LocalEnvVars.setSecret("last_run_id", remote_run_id);
    log.info(`SUCCESS: Started Run ID: ${remote_run_id}`);
    log.info(`Default user is: superadmin password: changeme! webconsole URL: ${credentials.cluster_url}`);
    return remote_run_id;
}

function uploadAndRun(api_token, config) {
    const scenarioName = config.model["scenario"]["name"];
    log.debug(`Uploading scenario: ${scenarioName}`);
    const scenario = config.scenario;
    Start.uploadArtifacts(api_token, scenario, config.working_dir);
    const uploaded_scenario = create_or_update_scenario(scenario, api_token, config);
    log.debug(`Uploaded scenario "${scenarioName}" successfully, running...`);
    return Start.run_uploaded_scenario(uploaded_scenario["id"], api_token);
}

function zipArtifactDir(artifact_dir_str) {
    const dir = join(artifact_dir_str);
    if (!existsSync(dir)) {
        throw new Error(`Directory doesn"t exist at: ${dir}`);
    }
    log.info(`Zipping image directory: ${dir}`);
    const output_file = `${dir}.tar.gz`;
    TarFileGenerator.pack_tar_tgz(dir, output_file);
    return output_file;
}

function uploadArtifacts(api_token, scenario, working_dir) {
    const uploaded = {};
    for (const profile of scenario["profiles"]) {
        if (profile["artifact_dir"]) {
            const artifact_dir = join(working_dir, profile["artifact_dir"]);
            const artifact_sha = Start.uploadArtifactIfNeeded(api_token, artifact_dir);
            profile["artifact_sha"] = artifact_sha.toString();
        }
    }

    function uploadArtifactIfNeeded(api_token, artifact_dir) {
        const zipped_filepath = Start.zipArtifactDir(artifact_dir);
        const sha256 = crypto.createHash("sha256").update(createReadStream(zipped_filepath)).digest("hex");
        const already_uploaded = Start.get_artifact_status(api_token, artifact_dir, sha256);
        return already_uploaded ? sha256 : Start.uploadArtifact(api_token, zipped_filepath, artifact_dir, sha256);
    }

    function uploadArtifact(api_token, zipped_filepath, artifact_dir, sha256) {
        log.info(`Uploading artifact for ${artifact_dir} with sha ${sha256}`);
        const url = `${BrowserUpUrl.browserupLoadUrl()}/customer_artifacts/${sha256}`;
        const formData = new FormData();
        formData.append("customer_artifact", createReadStream(zipped_filepath));
        try {
            const response = axios.put(url, formData, {
                headers: {
                    "api_token": api_token,
                    "sha256": sha256,
                    ...formData.getHeaders(),
                },
            });

            if (response.status === 200) {
                return sha256;
            } else {
                throw new Error(`Error uploading artifact: ${response.statusText}`);
            }
        } catch (ex) {
            log.error(ex.message);
            throw new UploadCustomerArtifactError(ex);
        }
    }

    function getArtifactStatus(api_token, artifact_dir, sha) {
        log.debug(`Getting artifact status of ${artifact_dir} with sha ${sha}`);
        const url = `${BrowserUpUrl.browserupLoadUrl()}/customer_artifacts/${sha}`;
        try {
            const response = axios.get(url, {
                headers: {
                    "api_token": api_token,
                    "Accept": "application/json",
                },
            });

            if (response.status === 200) {
                return true;
            } else if (response.status === 404) {
                return false;
            } else {
                throw new Error(`Error getting artifact status: ${response.statusText}`);
            }
        } catch (ex) {
            throw new GetCustomerArtifactStatusError(ex);
        }
    }

    function runUploadedScenario(uploaded_scenario_id, api_token) {
        log.debug(`Running uploaded scenario: ${uploaded_scenario_id}`);
        const url = `${BrowserupUrl.browserupLoadUrl()}/runs`;
        try {
            const response = axios.post(url, null, {
                headers: {
                    "api_token": api_token,
                    "scenario_id": uploaded_scenario_id,
                    "Accept": "application/json",
                },
            });

            if (response.status === 200) {
                const run = response.data;
                return run["id"];
            } else {
                throw new Error(`Unexpected response from WebConsole: ${response.statusText}`);
            }
        } catch (ex) {
            throw new StartRunError(ex);
        }
    }
}
