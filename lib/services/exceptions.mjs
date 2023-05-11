export class FailedToDeployStackException extends Error {}

export class InvalidHarException extends Error {}

export class StackNotReadyYetRetryableException {}

export class ClusterOlderThanCLI extends Error {
    constructor(clusterServicesVersion) {
        super(`Cluster services: "${clusterServicesVersion}" vs built-in services: "${BrowserUpCli.SERVICES_VERSION}"`);
    }
}

export class ClusterNewerThanCLI extends Error {
    constructor(clusterServicesVersion) {
        super(`Cluster services: "${clusterServicesVersion}" vs built-in services: "${BrowserUpCli.SERVICES_VERSION}"`);
    }
}
