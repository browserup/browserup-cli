export class BrowserUpError extends Error { }
export class ExitProcessError extends Error { }

export const ErrorType = {
    CLUSTER_ALREADY_EXISTS: "ClusterAlreadyExists",
    CLUSTER_NEWER_THAN_CLI: "ClusterNewerThanCLI",
    CLUSTER_NOT_FOUND: "BrowserUpClusterNotFound",
    CLUSTER_OLDER_THAN_CLI: "ClusterOlderThanCLI",
    CONTAINER: "Container",
    COMMANDER: "Commander",
    DOCKER_NOT_INSTALLED: "DockerNotInstalled",
    DOCKER_NOT_RUNNING: "DockerNotRunning",
    EXIT_PROCESS: "ExitProcess",
    GET_CUSTOMER_ARTIFACT_STATUS: "GetCustomerArtifactStatus",
    INVALID_CLUSTER_CREDENTIALS: "InvalidClusterCredentials",
    INVALID_COMMAND: "InvalidCommand",
    INVALID_CONFIG: "InvalidConfig",
    INVALID_HAR: "InvalidHar",
    INVALID_KEY_PAIR: "InvalidKeyPair",
    MISSING_CLUSTER_CREDENTIALS: "MissingClusterCredentials",
    NO_LAST_RUN_ID: "NoLastRunId",
    NO_REPORTS_DEFINED: "BrowserUpNoReportsDefined",
    SCENARIO_PAYLOAD: "ScenarioPayload",
    SERVICES_IMAGE_TAG_MISSING: "ServicesImageTagMissing",
    START_RUN: "StartRun",
    STOP_REMOTE_RUN: "StopRemoteRun",
    UNKNOWN_ERROR: "UnknownError",
    UPLOAD: "Upload",
    UPLOAD_CUSTOMER_ARTIFACT: "UploadCustomerArtifact",
    UPLOAD_LICENSE: "UploadLicense",
    UPLOAD_REPORT: "UploadReport",
    UPLOAD_SCENARIO: "UploadScenario",
    WEB_CONSOLE: "WebConsole",
    YAML_MISSING: "BrowserUpYamlMissing",
};

// Decorate errors with info about our error type, and our custom message. We don't
// want to overwrite the message, so we keep our own. We also want the error pretty much as it is.
export function decoratedError(opts) {
    if (isString(opts)) {
        opts = {msg: opts};
    }

    let error = null;
    if (opts.error === undefined) {
        error = new BrowserUpError();
    } else {
        error = opts.error;
    }
    if (opts.msg !== undefined) {
        error.msg ||= opts.msg;
    };

    if (opts.type !== undefined) {
        error.type ||= opts.type;
    };
    return error;
}

function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}
