import fs from "fs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {decoratedError, ErrorType} from "../browserup_errors.mjs";
import {WebConsoleClient} from "../services/webconsole_client.mjs";

export async function uploadLicense(options, _programOpts) {
        log.debug("Running Upload License");

        const licensePath = options.path;
        log.debug(` Uploading license: "${licensePath}"`);

        if (!licensePath) {
            throw decoratedError({msg: "License path is empty", type: ErrorType.INVALID_LICENSE_FILE});
        }

        if (!(fs.existsSync(licensePath) &&  fs.lstatSync(licensePath).isFile())) {
            throw decoratedError({ msg: `License file is not valid JSON: "${licensePath}"\n`, type: ErrorType.INVALID_LICENSE_FILE });
        }

        const credentials = ClusterCredentialsRepository.getCredentials(options, [
            "clusterUrl",
            "apiToken",
        ]);
        ExistingClusterValidator.validate(credentials);

        const response = await sendUploadLicense(credentials, licensePath);

        if (response && response.status === 304) {
            log.info("Upload Completed: License already exists");
        } else {
            log.debug(`RESPONSE: ${JSON.stringify(response.data)}`);
            log.info("Upload Completed: License uploaded");
        }

    log.debug("Upload License completed successfully");
}

export async function sendUploadLicense(credentials, licensePath) {
    try {
        return await WebConsoleClient.sendPostRequest({
            path: 'licenses',
            data: await prepareUploadLicensePayload(licensePath),
            qParams: {
                api_token: credentials.apiToken
            },
            expectedCodes: [200, 201, 304]
        })
    } catch (e) {
        throw decoratedError(`${e.name}: ${e.message}`);
    }
}

export async function prepareUploadLicensePayload(licensePath) {
    const license = JSON.parse(fs.readFileSync(licensePath, "utf8"));
    return {license: license};
}
