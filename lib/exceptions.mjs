export class ClusterNewerThanCLI extends Error{}

export class ClusterOlderThanCLI extends Error { }

export class UploadError extends Error {
}

export class CommanderError extends Error {
}

export class WebConsoleError extends Error {}

export class UploadLicenseError extends UploadError {
    constructor(ex) {
        super(ex, "Failed to upload license");
    }
}

export class UploadScenarioError extends UploadError {
    constructor(ex) {
        super(ex, "Failed to upload Scenario");
    }
}

export class UploadReportError extends WebConsoleError {
    constructor(ex) {
        super(ex, "Failed to upload Report");
    }
}

export class UploadCustomerArtifactError extends WebConsoleError {
    constructor(ex) {
        super(ex, "Failed to upload customer artifact");
    }
}

export class GetCustomerArtifactStatusError extends WebConsoleError {
    constructor(ex) {
        super(ex, "Error getting status of artifact");
    }
}

export class StopRemoteRunError extends WebConsoleError {
    constructor(original_ex, msg = null) {
        super(original_ex, 'Failed to stop remote run');
    }
}

export class DockerNotInstalled extends Error {}

export class DockerNotRunning extends Error {}

export class BrowserUpClusterNotFound extends Error {}

export class BrowserUpYamlMissing extends Error {}

export class BrowserUpNoReportsDefined extends Error {
    constructor(msg = "No reports defined in config under reports key".red) {
        super(msg);
    }
}

export class ClusterAlreadyExistsException extends Error {}

export class InvalidConfigException extends Error {}

export class NoLastRunIdError extends Error {}

export class StartRunError extends WebConsoleError {
    constructor(original_ex, msg = null) {
        super(original_ex, 'Failed to start Run');
    }
}

export class InvalidClusterCredentials extends Error {
    constructor(msg = null) {
        super(`Invalid cluster credentials: ${msg}`);
    }
}

