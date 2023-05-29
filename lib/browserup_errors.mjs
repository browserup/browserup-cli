import {BrowserUpCli} from "./browserup_cli.mjs";

export class BrowserUpError extends Error { }

export class FakeProcessExitForTests extends Error {
    constructor(innerError) {
        super("Exception to simulate the process exiting so our test suite can keep running");
        this.innerError = innerError;
    }
}
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

export const ErrorType = {
    CLUSTER_ALREADY_EXISTS: "Cluster exists - consider 'destroy' first to terminate current cluster",
    CLUSTER_NEWER_THAN_CLI: "Cluster is newer than CLI, update CLI",
    CLUSTER_NOT_FOUND: "BrowserUp Cluster not found",
    CLUSTER_OLDER_THAN_CLI: "Cluster is older than CLI, upgrade cluster",
    CONTAINER: "Container issue occurred",
    COMMANDER: "Commander issue occurred",
    DOCKER_COMPOSE_COMMAND: "Problem occured while running a Docker Compose Command",
    DOCKER_NOT_INSTALLED: "Docker is not installed",
    DOCKER_NOT_RUNNING: "Docker is not running",
    EXIT_PROCESS: "Process exited",
    GET_CUSTOMER_ARTIFACT_STATUS: "Failed to get customer artifact status",
    INVALID_CLUSTER_CREDENTIALS: "Could not find credentials for an active cluster",
    INVALID_COMMAND: "Invalid command provided",
    INVALID_CONFIG: "Invalid config file",
    INVALID_HAR: "Invalid HAR file provided",
    INVALID_KEY_PAIR: "Invalid key pair",
    MISSING_CLUSTER_CREDENTIALS: "Error Uploading license",
    NO_LAST_RUN_ID: "Expected a last run id for the last started test on this install, but none found",
    NO_REPORTS_DEFINED: "No Reports Defined",
    SCENARIO_PAYLOAD: "Scenario payload issue occurred",
    SERVICES_IMAGE_TAG_MISSING: "Failed to Upgrade Cluster -- servicesImageTag not in credentials",
    START_RUN: "Failed to start run",
    STOP_REMOTE_RUN: "Failed to stop remote run",
    UNKNOWN: "Unknown issue occurred",
    UPLOAD: "Upload issue occurred",
    UPLOAD_CUSTOMER_ARTIFACT: "Failed to upload customer artifact",
    UPLOAD_LICENSE: "Error Uploading license",
    UPLOAD_REPORT: "Failed to create or update report",
    UPLOAD_SCENARIO: "Failed to upload scenario",
    WEB_CONSOLE: "Web Console issue occurred",
    YAML_MISSING: "BrowserUp YAML file missing",
};


// Decorate errors with info about our error type, and our custom message. We don't
// want to overwrite the message, so we keep our own. We also want the error pretty much as it is.
export function decoratedError(opts) {
    if (isString(opts)) {
        opts = { msg: opts };
    }

    let error = null;
    if (opts.error === undefined) {
        error = new BrowserUpError();
    } else {
        error = opts.error;
    }

    if (opts.type !== undefined) { error.type ||= opts.type; }

    // Use Our own message if passed. If not, we use the default from our ErrorType
    if (opts.msg !== undefined) {
        error.msg ||= opts.msg;
    }
    else {
        if (error.type !== undefined) {
            error.msg ||= ErrorType[error.type];
        }
        error.msg ||= ErrorType.UNKNOWN;
    }


    return error;
}

function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}
