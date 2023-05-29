import "url";
import {ClusterType} from "./cluster_type.mjs";
import { API_TOKEN_SIZE,CLUSTER_NAME_PREFIX} from "../constants.mjs";

import { decoratedError } from "../browserup_errors.mjs";
import {CLUSTER_NAME_LOCAL_PREFIX} from "../constants.mjs";

const apiTokenSize = 20;

export class ClusterCredentials {
    constructor(opts, requiredFields= []) {
        this.clusterUrl = opts.clusterUrl;
        this.apiToken = opts.apiToken;
        this.clusterName = opts.clusterName;
        this.region = opts.region;
        this.clusterType = opts.clusterType;
        this.servicesImageTag = opts.servicesImageTag;
        this.customServicesImageTag = opts.customServicesImageTag;
        this.standardImageTag = opts.standardImageTag;

        if (!this.nullOrValid(this.clusterType, this.isClusterTypeValid)) {
            throw decoratedError({ msg:`Invalid cluster type provided: "${this.clusterType}"`});
        }

        if (!this.nullOrValid(this.clusterUrl, this.isClusterUrlValid)) {
            throw decoratedError({ msg: `Invalid cluster url provided: "${this.clusterUrl}"`});
        }

        if (!this.nullOrValid(this.apiToken, this.isApiTokenValid)) {
            throw decoratedError({ msg: "Invalid api token provided"});
        }

        if (!this.nullOrValid(this.clusterName, this.isClusterNameValid)) {
            throw decoratedError({ msg: `Invalid cluster name provided: "${this.clusterName}"`});
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
            throw decoratedError(`Unexpected field to validate: ${fieldName}`);
        }

        if (!this[fieldName]) {
            const fields = Object.keys(this).join(",");
            throw decoratedError(`Couldn"t find credentials property: "${fieldName}" in fields ${fields}`);
        }
    }

    nullOrValid(variable, validationMethod) {
        if (variable === null || variable == undefined || variable === "") {
            return true;
        }
        return validationMethod.call(this, variable);
    }

    getClusterType(clusterName) {
        if (!clusterName) {
            return null;
        }
        return clusterName.startsWith(CLUSTER_NAME_LOCAL_PREFIX) ? ClusterType.LOCAL : ClusterType.AWS;
    }

    isApiTokenValid() {
        return this.apiToken && this.apiToken.length === API_TOKEN_SIZE;
    }

    isClusterNameValid() {
        return this.clusterName !== null && this.clusterName.startsWith(CLUSTER_NAME_PREFIX);
    }

    isClusterTypeValid() {
        return Object.values(ClusterType).includes(this.clusterType);
    }

    isClusterUrlValid() {
        try {
            new URL(this.clusterUrl);
            return true;
        } catch {
            return false;
        }
    }
}
