// Import required libraries
import { config as dotenvConfig } from "dotenv";
import "../models/cluster_credentials.mjs";
import "../browserup_errors.mjs";
import  "../utils/local_env_vars.mjs";
import {LocalEnvVars} from "../utils/local_env_vars.mjs";
import {ClusterCredentials} from "../models/cluster_credentials.mjs";
import {CLUSTER_URL_ENV_NAME} from "../constants.mjs";
import {decoratedError, ErrorType} from "../browserup_errors.mjs";


dotenvConfig();

export class ClusterCredentialsRepository {
    static getCredentials(options, requiredFields = []) {
        log.debug("apiToken: " + this.getApiToken(options));
        let opts=
            {
                apiToken: this.getApiToken(options),
                clusterUrl: LocalEnvVars.getEnvOrSecret(CLUSTER_URL_ENV_NAME, "clusterUrl"),
                clusterName: this.getClusterName(options),
                region: LocalEnvVars.getSecret("region"),
                clusterType: this.getClusterType(options),
                standardImageTag: LocalEnvVars.getSecret("standardImageTag"),
                servicesImageTag: LocalEnvVars.getSecret("servicesImageTag"),
                isCustomServicesImageTag: LocalEnvVars.getSecret("isCustomServicesImageTag")};
        try {
            return new ClusterCredentials(opts, requiredFields);
        } catch (e) {
            throw decoratedError({error: e, type: ErrorType.INVALID_CLUSTER_CREDENTIALS});
        }
    }

     static clearCredentials() {
         LocalEnvVars.clearSecrets();
    }

    static saveCredentials(credentials) {
        log.info("Saving apiToken: " + credentials.apiToken);
        LocalEnvVars.setSecrets({
            clusterName: credentials.clusterName,
            clusterUrl: credentials.clusterUrl,
            apiToken: credentials.apiToken,
            clusterType: credentials.clusterType,
            region: credentials.region,
            servicesImageTag: credentials.servicesImageTag,
            standardImageTag: credentials.standardImageTag
        });
    }

    static getApiToken(options) {
        let apiToken = options.apiToken;
        apiToken = apiToken || process.env.BROWSERUP_API_TOKEN;
        apiToken = apiToken || LocalEnvVars.getSecret("apiToken");
        return apiToken;
    }

    static getClusterName(options) {
        let clusterName = options.clusterName;
        clusterName = clusterName || process.env.BROWSERUP_CLUSTER_NAME;
        clusterName = clusterName || LocalEnvVars.getSecret("clusterName");
        return clusterName;
    }

    static getClusterType(options) {
        let clusterType = options.clusterType;
        clusterType = clusterType || process.env.BROWSERUP_CLUSTER_TYPE;
        clusterType = clusterType || LocalEnvVars.getSecret("clusterType");
        return clusterType;
    }
}

