import {BrowserUpCli} from "../browserup_cli.mjs";
import {ClusterType} from "./cluster_type.mjs";


export class LocalClusterParams {
    constructor({ apiToken, servicesImageTag, standardImageTag }) {
        this._apiToken = apiToken;
        this._servicesImageTag = servicesImageTag;
        this._standardImageTag = standardImageTag;
    }

    get apiToken() {
        return this._apiToken;
    }

    get standardImageTag() {
        return this._standardImageTag;
    }

    get servicesImageTag() {
        return this._servicesImageTag || BrowserUpCli.SERVICES_VERSION;
    }

    isRemote() {
        return false;
    }

    isLocal() {
        return true;
    }

    isCustomServicesImageTag() {
        return this._servicesImageTag != null;
    }

    get clusterType() {
        return ClusterType.LOCAL;
    }
}
