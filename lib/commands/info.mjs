import {decoratedError, ErrorType} from "../browserup_errors.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";

export async function info(options, _programOpts) {
    let credentials;
    log.debug("Starting Info command");
    try {
        credentials = ClusterCredentialsRepository.getCredentials(options, ["clusterUrl", "apiToken"]);
    } catch (e) {
        throw decoratedError({error: e, type: ErrorType.INVALID_CLUSTER_CREDENTIALS});
    }
    log.info(JSON.stringify(credentials, null, 2));
    log.debug("Info completed successfully");
    ExistingClusterValidator.validate(credentials);
}
