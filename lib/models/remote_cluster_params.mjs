// remoteClusterParams.js
import { SERVICES_VERSION } from "../browserup_cli.mjs";
import {ClusterType} from "./cluster_type.mjs";

export class RemoteClusterParams {
    constructor({
                    apiToken,
                    instanceType,
                    region,
                    adminEmails,
                    keyPairName,
                    minionsKeyPairName,
                    servicesImageTag,
                    standardImageTag,
                }) {
        this.instanceType = instanceType;
        this.region = region;
        this.adminEmails = adminEmails;
        this.apiToken = apiToken;
        this.keyPairName = keyPairName;
        this.minionsKeyPairName = minionsKeyPairName;
        this._servicesImageTag = servicesImageTag;
        this.standardImageTag = standardImageTag;
    }

    get servicesImageTag() {
        return this._servicesImageTag || SERVICES_VERSION;
    }

    isRemote() {
        return true;
    }

    isLocal() {
        return false;
    }

    isCustomServicesImageTag() {
        return this._servicesImageTag != null;
    }

    get clusterType() {
        return ClusterType.AWS;
    }
}
