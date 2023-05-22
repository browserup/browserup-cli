export class FailedToDeployStackError extends Error {}

export class InvalidHarError extends Error {}

export class StackNotReadyYetRetryableError {}

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
