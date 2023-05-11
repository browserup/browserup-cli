import "url";
import("./cluster_type.mjs");

const clusterNameLocalPrefix = "your_local_prefix_here";
const clusterNamePrefix = "your_prefix_here";
const apiTokenSize = 20;

export class ClusterCredentials {
    constructor({
                    clusterUrl = null,
                    clusterType = null,
                    apiToken = null,
                    clusterName = null,
                    region = null,
                    requiredFields = [],
                    servicesImageTag = null,
                    customServicesImageTag = false,
                    standardImageTag = null,
                }) {
        this.clusterUrl = clusterUrl;
        this.apiToken = apiToken;
        this.clusterName = clusterName;
        this.region = region;
        this.clusterType = clusterType;
        this.servicesImageTag = servicesImageTag;
        this.customServicesImageTag = customServicesImageTag;
        this.standardImageTag = standardImageTag;

        if (!this.nilOrValid(this.clusterType, this.isClusterTypeValid)) {
            throw new Error(`Invalid cluster type provided: "${this.clusterType}"`);
        }

        if (!this.nilOrValid(this.clusterUrl, this.isClusterUrlValid)) {
            throw new Error(`Invalid cluster url provided: "${this.clusterUrl}"`);
        }

        if (!this.nilOrValid(this.apiToken, this.isApiTokenValid)) {
            throw new Error("Invalid api token provided");
        }

        if (!this.nilOrValid(this.clusterName, this.isClusterNameValid)) {
            throw new Error(`Invalid cluster name provided: "${this.clusterName}"`);
        }

        requiredFields.forEach((requiredField) => {
            this.requireField(requiredField);
        });
    }

    clusterHost() {
        return new URL(this.clusterUrl).host;
    }

    localCluster() {
        return this.clusterType === ClusterType.LOCAL;
    }

    remoteCluster() {
        return [ClusterType.AWS].includes(this.clusterType);
    }

    isCustomServicesImageTag() {
        return this.customServicesImageTag;
    }

    prettyFormatted() {
        const hash = Object.keys(this)
            .filter((key) => key !== "apiToken")
            .reduce((acc, key) => {
                acc[key] = this[key];
                return acc;
            }, {});

        if (hash["standardImageTag"] === null || hash["standardImageTag"] === "") {
            hash["standardImageTag"] = "(not overridden, version built into services images)";
        }
        return hash;
    }

    toString() {
        return `Name: "${this.clusterName}", URL: "${this.clusterUrl}", type: "${this.clusterType}"`;
    }

    equals(other) {
        return (
            this.clusterUrl === other.clusterUrl &&
            this.clusterName === other.clusterName &&
            this.clusterType === other.clusterType &&
            this.apiToken === other.apiToken &&
            this.region === other.region
        );
    }

    requireField(fieldName) {
        if (!(fieldName in this)) {
            throw new Error(`Unexpected field to validate: ${fieldName}`);
        }

        if (!this[fieldName]) {
            throw new Error(`Couldn"t find credentials property: "${fieldName}"`);
        }
    }

    nilOrValid(variable, validationMethod) {
        if (variable === null || variable === "") {
            return true;
        }
        return validationMethod.call(this, variable);
    }

    getClusterType(clusterName) {
        if (!clusterName) {
            return null;
        }
        return clusterName.startsWith(clusterNameLocalPrefix) ? ClusterType.LOCAL : ClusterType.AWS;
    }

    isApiTokenValid(apiToken) {
        return api_token && api_token.length === API_TOKEN_SIZE;
    }

    isClusterNameValid(clusterName) {
        return clusterName !== null && clusterName.startsWith(clusterNamePrefix);
    }

    isClusterTypeValid(clusterType) {
        return Object.values(ClusterType).includes(clusterType);
    }

    isClusterUrlValid(clusterUrl) {
        try {
            new URL(clusterUrl);
            return true;
        } catch {
            return false;
        }
    }
}
