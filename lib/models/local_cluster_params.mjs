import {BrowserUpCli, SERVICES_VERSION} from "../browserup_cli.mjs";
import {ClusterType} from "./cluster_type.mjs";


export class LocalClusterParams {
    constructor({ apiToken, servicesImageTag, standardImageTag, useLocalCache }) {
        this._apiToken = apiToken;
        this._servicesImageTag = servicesImageTag;
        this._standardImageTag = standardImageTag;
        this._useLocalCache = useLocalCache;
    }

    get apiToken() {
        return this._apiToken;
    }

    get standardImageTag() {
        return this._standardImageTag;
    }

    get servicesImageTag() {
        return this._servicesImageTag || SERVICES_VERSION;
    }

    get useLocalCache() {
        return this._useLocalCache;
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
