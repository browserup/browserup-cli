import "../utils/services_version.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {AwsClusterPilot} from "../services/aws/aws_cluster_pilot.mjs";
import {LocalClusterPilot} from "../services/local_cluster_pilot.mjs";
import {BrowserUpCli, SERVICES_VERSION} from "../browserup_cli.mjs";
import { ServicesVersion} from "../utils/services_version.mjs";
import {decoratedError, ErrorType} from "../browserup_errors.mjs";

export async function upgrade(options, _programOpts) {
    let credentials;
    log.debug("Running Upgrade");
    try {
        credentials = ClusterCredentialsRepository.getCredentials(options, ["clusterName"]);
    } catch (e) {
        throw decoratedError({msg: `Invalid Cluster Credentials`,  error: e, type: ErrorType.INVALID_CLUSTER_CREDENTIALS});
    }

    if (credentials.servicesImageTag == null) {
        throw decoratedError({msg: `Failed to Upgrade Cluster -- servicesImageTag not in credentials`, type: ErrorType.SERVICES_IMAGE_TAG_MISSING});
    }


    if (!ServicesVersion.isCliNewerThanCluster(credentials.servicesImageTag)) {
        if (ServicesVersion.isCliOlderThanCluster(credentials.servicesImageTag)) {
            log.warn("CLI is older than cluster, cannot upgrade");
        } else {
            log.warn("CLI and cluster have the same services version, nothing to upgrade");
        }
        return;
    }

    log.debug(`Upgrading ${credentials.servicesImageTag} -> ${SERVICES_VERSION}`);

    if (credentials.localCluster()) {
        await upgradeLocalCluster(credentials);
    } else {
        await upgradeRemoteCluster(credentials, options.skipConfirmation);
    }
    log.info(
        `Upgraded cluster to "${SERVICES_VERSION}" successfully, webconsole URL: ${credentials.clusterUrl}`
    );
    credentials.servicesImageTag = SERVICES_VERSION;
    await ClusterCredentialsRepository.saveCredentials(credentials);
    log.debug("Upgrade completed successfully");
}

export async function upgradeLocalCluster(credentials) {
    await new LocalClusterPilot().upgradeCluster(credentials);
}

export async function upgradeRemoteCluster(credentials, bypassConfirmation) {
    await new AwsClusterPilot().upgradeCluster(credentials, bypassConfirmation);
}

