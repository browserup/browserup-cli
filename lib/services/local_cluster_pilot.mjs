import {ClusterSecretsProvider} from "./cluster_secrets_provider.mjs";
import {ClusterNameGenerator} from "../services/cluster_name_generator.mjs";
import {ClusterType} from "../models/cluster_type.mjs";
import {ClusterCredentials} from "../models/cluster_credentials.mjs";
import {ClusterCredentialsRepository} from "./cluster_credentials_repository.mjs";
import {DockerClient} from "../services/docker_client.mjs";
import  {WebConsoleClient} from "../services/webconsole_client.mjs";
import { ClusterPilot } from "./cluster_pilot.mjs";
import {BrowserUpPaths} from "../utils/browserup_paths.mjs";

export class LocalClusterPilot extends ClusterPilot {
    async createCluster(clusterParams, clusterName) {
        const secrets = ClusterSecretsProvider.get();
        const webconsoleUrl = `${this.protocol}://localhost:${secrets["WEBCONSOLE_PORT"]}`;
        clusterName = ClusterNameGenerator.generateClusterName(ClusterType.AWS);
        const apiToken = clusterParams.apiToken;
        const clusterCredentials = new ClusterCredentials({
            clusterUrl: webconsoleUrl,
            clusterType: ClusterType.LOCAL,
            apiToken: apiToken,
            clusterName: clusterName,
            standardImageTag: clusterParams.standardImageTag,
            servicesImageTag: clusterParams.servicesImageTag,
            isCustomServicesImageTag: clusterParams.isCustomServicesImageTag
        });
        ClusterCredentialsRepository.saveCredentials(clusterCredentials);
        const composeYmlFile = BrowserUpPaths.dockerComposeYmlPath();
        const backendServices = ["zookeeper", "rabbitmq", "influxdb", "mysql"];
        if (process.env.CHRONOGRAF) backendpush("chrono");
        const frontendServices = [];
        if (!process.env.DEBUG_WEBCONSOLE) frontendServices.push("webconsole");
        const middlewareServices = ["grid-java-coordinator", "grid-java-api"];
        const allServices = backendServices.concat(middlewareServices, frontendServices);

        const envs = {
            INITIAL_API_TOKEN: apiToken,
            BROWSERUP_CLUSTER_NAME: clusterName,
            STANDARD_IMAGE_VERSION_TAG_OVERRIDE: clusterParams.standardImageTag,
            BROWSERUP_MINION_DEBUG: process.env.BROWSERUP_MINION_DEBUG,
            BROWSERUP_MINION_DEBUG_PORT: process.env.BROWSERUP_MINION_DEBUG_PORT,
            BROWSERUP_MINION_DEBUG_SUSPEND: process.env.BROWSERUP_MINION_DEBUG_SUSPEND
        };
        Object.assign(envs, secrets);

        await DockerClient.dockerComposeUp(allServices, composeYmlFile, envs );
        log.debug(`Logs will be available soon at: http://localhost:${secrets["GRAFANA_PORT"]}`);
        if (!process.env.DEBUG_WEBCONSOLE) await WebConsoleClient.waitForRailsReady(webconsoleUrl);
        return clusterCredentials;
    }

    async destroyCluster(destroyOpts) {
        destroyOpts['clusterName'] ||= "";
        destroyOpts['region'] ||= "us-east";
        destroyOpts['removeVolumes'] ||= false;

        const composeYmlFile = BrowserUpPaths.dockerComposeYmlPath();
        await DockerClient.dockerComposeDown(composeYmlFile, destroyOpts);
    }

    async upgradeCluster(credentials) {
        const composeYmlFile = dockerComposeYmlPath();
        const secrets = ClusterSecretsProvider.get();
        log.debug("Shutting down existing cluster's services...");
        await DockerClient.dockerComposeDown({ dockerComposePath: composeYmlFile, removeVolumes: false, env: secrets });
        log.debug(`Pulling new images for target version (${process.env.SERVICES_VERSION})`);
        await DockerClient.dockerComposePull({ dockerComposePath: composeYmlFile });
        const clusterParams = new LocalClusterParams({
            apiToken: credentials.apiToken,
            servicesImageTag: process.env.SERVICES_VERSION,
            standardImageTag: credentials.standardImageTag
        });
        const localClusterPilotInstance = new LocalClusterPilot();
        await localClusterPilotInstance.createCluster({ clusterParams: clusterParams, clusterName: "" });
    }

    get protocol() {
        return process.env.WEBCONSOLE_PROTOCOL || "http";
    }
}
