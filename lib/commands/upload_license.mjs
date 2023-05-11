import fs from "fs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";

import axios from "axios";
import {logAndExit} from "../utils/cli_helpers.mjs";

export async function uploadLicense(options, program_opts) {
    try {
        log.debug("Running Upload License");
        const credentials = await ClusterCredentialsRepository.getCredentials(options, [
            "cluster_url",
            "api_token",
        ]);
        ExistingClusterValidator.validate(credentials);

        const licensePath = options.path;
        log.debug(`Uploading license: "${licensePath}"`);

        if (!licensePath) {
            throw new Error("License path is empty");
        }

        if (!fs.existsSync(licensePath)) {
            throw new Error(`License file not found: "${licensePath}"`);
        }

        const response = await this.sendUploadLicense(credentials, licensePath);

        if (response && response.status === 304) {
            log.info("Upload Completed: License already exists");
        } else {
            log.debug(`RESPONSE: ${JSON.stringify(response.data)}`);
            log.info("Upload Completed: License uploaded");
        }
    } catch (error) {
        logAndExit(error.message, error);
    }
    log.debug("Upload License completed successfully");
}

export async function sendUploadLicense(credentials, licensePath) {
    try {
        const payload = this.prepareUploadLicensePayload(licensePath);
        const url = `${credentials.cluster_url}/licenses`;
        const result = await axios.post(url, payload, {
            params: {api_token: credentials.api_token},
            headers: {Accept: "application/json"},
        });
        return result;
    } catch (error) {
        throw new Error(`${error.name}: ${error.message}`);
    }
}

export async function prepareUploadLicensePayload(licensePath) {
    const license = JSON.parse(fs.readFileSync(licensePath, "utf8"));
    return {license: license};
};
