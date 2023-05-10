import '../utils/services_version.mjs';
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {AwsClusterPilot} from "../services/aws/aws_cluster_pilot.mjs";
import {LocalClusterPilot} from "../services/local_cluster_pilot.mjs";
import {BrowserUpCli} from "../browserup_cli.mjs";
import { ServicesVersion} from "../utils/services_version.mjs";

export async function upgrade(options) {
    let credentials;
    log.debug('Running Upgrade');
    try {
        credentials = await ClusterCredentialsRepository.getCredentials({
            options,
            requiredFields: ['cluster_name'],
        });
    } catch (e) {
        throw new InvalidClusterCredentials(e.message);
    }

    if (!ServicesVersion.isCliNewerThanCluster(credentials.servicesImageTag)) {
        if (ServicesVersion.isCliOlderThanCluster(credentials.servicesImageTag)) {
            log.warn('CLI is older than cluster, cannot upgrade');
        } else {
            log.warn('CLI and cluster have the same services version, nothing to upgrade');
        }
        return;
    }

    log.debug(
        `CLI has newer version of services (${BrowserUpCli.SERVICES_VERSION}) going to upgrade cluster (from ${credentials.servicesImageTag})`
    );

    if (credentials.localCluster()) {
        await this.upgradeLocalCluster(credentials);
    } else {
        await this.upgradeRemoteCluster(credentials, options.bypass_confirmation);
    }
    log.info(
        `Upgraded cluster to '${BrowserUpCli.SERVICES_VERSION}' successfully, webconsole URL: ${credentials.cluster_url}`
    );
    credentials.servicesImageTag = BrowserUpCli.SERVICES_VERSION;
    await ClusterCredentialsRepository.saveCredentials(credentials);
    log.debug('Upgrade completed successfully');
}

export async function upgradeLocalCluster(credentials) {
    const localClusterPilot = new LocalClusterPilot();
    await localClusterPilot.upgradeCluster(credentials);
}

export async function upgradeRemoteCluster(credentials, bypassConfirmation) {
    const awsClusterPilot = new AwsClusterPilot();
    await awsClusterPilot.upgradeCluster(credentials, bypassConfirmation);
}

