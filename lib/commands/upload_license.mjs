import fs from "fs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {decoratedError} from "../browserup_errors.mjs";

import axios from "axios";
import {logErrors} from "../utils/cli_helpers.mjs";

export async function uploadLicense(options, _programOpts) {
    try {
        log.debug("Running Upload License");
        const credentials = ClusterCredentialsRepository.getCredentials(options, [
            "clusterUrl",
            "apiToken",
        ]);
        ExistingClusterValidator.validate(credentials);

        const licensePath = options.path;
        log.debug(`Uploading license: "${licensePath}"`);

        if (!licensePath) {
            throw decoratedError("License path is empty");
        }

        if (!fs.existsSync(licensePath)) {
            throw decoratedError(`License file not found: "${licensePath}"`);
        }

        const response = await this.sendUploadLicense(credentials, licensePath);

        if (response && response.status === 304) {
            log.info("Upload Completed: License already exists");
        } else {
            log.debug(`RESPONSE: ${JSON.stringify(response.data)}`);
            log.info("Upload Completed: License uploaded");
        }
    } catch (e) {
        return logErrors(e.message, e);
    }
    log.debug("Upload License completed successfully");
}

export async function sendUploadLicense(credentials, licensePath) {
    try {
        const payload = this.prepareUploadLicensePayload(licensePath);
        const url = `${credentials.clusterUrl}/licenses`;
        const result = await axios.post(url, payload, {
            params: {api_token: credentials.apiToken},
            headers: {Accept: "application/json"},
        });
        return result;
    } catch (e) {
        throw decoratedError(`${e.name}: ${e.message}`);
    }
}

export async function prepareUploadLicensePayload(licensePath) {
    const license = JSON.parse(fs.readFileSync(licensePath, "utf8"));
    return {license: license};
}
