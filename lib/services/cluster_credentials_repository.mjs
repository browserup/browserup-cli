// Import required libraries
import { config as dotenvConfig } from 'dotenv';
import '../models/cluster_credentials.mjs';
import '../../lib/exceptions.mjs';
import  '../utils/local_env_vars.mjs';
import {LocalEnvVars} from "../utils/local_env_vars.mjs";
import {InvalidClusterCredentials} from "../../lib/exceptions.mjs";
dotenvConfig();

export class ClusterCredentialsRepository {
    static getCredentials(options, requiredFields = []) {
        const apiToken = this.getApiToken(options);
        const clusterUrl = LocalEnvVars.getEnvOrSecret(process.env.CLUSTER_URL_ENV_NAME, 'cluster_url');
        const clusterName = this.getClusterName(options);
        const region = LocalEnvVars.getSecret('region');
        const clusterType = this.getClusterType(options);
        const standardImageTag = LocalEnvVars.getSecret('standard_image_tag');
        const servicesImageTag = LocalEnvVars.getSecret('servicesImageTag');
        const isCustomServicesImageTag = LocalEnvVars.getSecret('isCustomServicesImageTag');

        try {
            return new ClusterCredentials({
                clusterUrl,
                apiToken,
                clusterName,
                region,
                clusterType,
                standardImageTag,
                servicesImageTag,
                isCustomServicesImageTag,
                requiredFields
            });
        } catch (e) {
            throw new InvalidClusterCredentials(e.message);
        }
    }

    static clearCredentials() {
        LocalEnvVars.clearSecrets();
    }

    static saveCredentials(credentials) {
        LocalEnvVars.setSecrets({
            cluster_name: credentials.clusterName,
            cluster_url: credentials.clusterUrl,
            api_token: credentials.apiToken,
            cluster_type: credentials.clusterType,
            region: credentials.region,
            servicesImageTag: credentials.servicesImageTag,
            standard_image_tag: credentials.standardImageTag
        });
    }

    static getApiToken(options) {
        let apiToken = options.apiToken;
        apiToken = apiToken || process.env.BROWSERUP_API_TOKEN;
        apiToken = apiToken || LocalEnvVars.getSecret('api_token');
        return apiToken;
    }

    static getClusterName(options) {
        let clusterName = options.clusterName;
        clusterName = clusterName || process.env.BROWSERUP_CLUSTER_NAME;
        clusterName = clusterName || LocalEnvVars.getSecret('cluster_name');
        return clusterName;
    }

    static getClusterType(options) {
        let clusterType = options.clusterType;
        clusterType = clusterType || process.env.BROWSERUP_CLUSTER_TYPE;
        clusterType = clusterType || LocalEnvVars.getSecret('cluster_type');
        return clusterType;
    }
}

