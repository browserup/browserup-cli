import { InvalidClusterCredentials} from "../exceptions.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";

export async function info(options, program_opts) {
    let credentials;
    log.debug("Starting Info command");
    try {
        credentials = await ClusterCredentialsRepository.getCredentials(options, ["cluster_url", "api_token"]);
    } catch (error) {
        if (error instanceof InvalidClusterCredentials) {
            throw new InvalidClusterCredentials(error.message);
        } else {
            throw error;
        }
    }
    log.info(JSON.stringify(credentials, null, 2));
    log.debug("Info completed successfully");
    ExistingClusterValidator.validate(credentials);
}
