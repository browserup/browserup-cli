import { ClusterSecretsProvider } from "./cluster_secrets_provider.mjs";
import { ClusterNameGenerator } from "../services/cluster_name_generator.mjs";
import { ClusterType } from "../models/cluster_type.mjs";
import { ClusterCredentials } from "../models/cluster_credentials.mjs";
import { ClusterCredentialsRepository } from "./cluster_credentials_repository.mjs";
import { DockerClient } from "../services/docker_client.mjs";
import { WebConsoleClient } from "../services/webconsole_client.mjs";
import { ClusterPilot } from "./cluster_pilot.mjs";
import { BrowserUpPaths } from "../utils/browserup_paths.mjs";
import { LocalClusterParams } from "../models/local_cluster_params.mjs";
import {SERVICES_VERSION } from "../browserup_cli.mjs";
import {checkLocalPortsAreFree } from "../utils/check_local_ports_are_free.mjs";

export class LocalClusterPilot extends ClusterPilot {
    async checkPortsFree() {
        let services = {
            "zookeeper": LocalClusterParams.ZOOKEEPER_PORT,
            "rabbitmq": LocalClusterParams.RABBITMQ_PORT,
            "webconsole": LocalClusterParams.BROWSERUP_WEBCONSOLE_PORT
        };
        checkLocalPortsAreFree(services);
    }

    async createCluster({ clusterParams }) {
        const secrets = ClusterSecretsProvider.get();
        const webconsoleUrl = `${this.protocol}://localhost:${secrets["BROWSERUP_WEBCONSOLE_PORT"]}`;
        const clusterName = ClusterNameGenerator.generateClusterName(ClusterType.LOCAL);
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
        const backendServices = ["zookeeper", "rabbitmq", "clickhouse"];
        const frontendServices = [];
        if (!process.env.DEBUG_WEBCONSOLE) frontendServices.push("webconsole");
        const middlewareServices = ["grid-java-coordinator", "grid-java-api", "grid-java-observer", "grafana"];
        const allServices = backendServices.concat(middlewareServices, frontendServices);

        const envs = {
            INITIAL_API_TOKEN: apiToken,
            BROWSERUP_CLUSTER_NAME: clusterName,
            BROWSERUP_STANDARD_IMAGE_VERSION_TAG_OVERRIDE: clusterParams.standardImageTag,
            BROWSERUP_MINION_DEBUG: process.env.BROWSERUP_MINION_DEBUG,
            BROWSERUP_MINION_DEBUG_PORT: process.env.BROWSERUP_MINION_DEBUG_PORT,
            BROWSERUP_MINION_DEBUG_SUSPEND: process.env.BROWSERUP_MINION_DEBUG_SUSPEND,
            BROWSERUP_GRID_COORDINATOR_DEBUG: process.env.BROWSERUP_GRID_COORDINATOR_DEBUG,
            BROWSERUP_GRID_COORDINATOR_DEBUG_PORT: process.env.BROWSERUP_GRID_COORDINATOR_DEBUG_PORT,
            BROWSERUP_MINION_USE_LOCAL_CACHE: clusterParams.useLocalCache,
            BROWSERUP_USE_LOCAL_DOCKER_CACHED_IMAGE: clusterParams.useLocalCache,
        };
        Object.assign(envs, secrets);

        if (!clusterParams.useLocalCache) {
            log.debug(`Pulling images. Using dockerComposePath ${composeYmlFile}`)
            await DockerClient.dockerComposePull({dockerComposePath: composeYmlFile})
        } else {
            log.debug('Using local docker cache for services images')
        }
        log.debug('Starting services...')
        await DockerClient.dockerComposeUp(allServices, composeYmlFile, envs);
        log.debug(`Logs will be available soon at: http://localhost:${secrets["BROWSERUP_GRAFANA_PORT"]}`);
        if (!process.env.DEBUG_WEBCONSOLE) await WebConsoleClient.waitForRailsReady(webconsoleUrl);
        return clusterCredentials;
    }

    async destroyCluster({ clusterName, region = null, removeVolumes = true }) {
        const composeYmlFile = BrowserUpPaths.dockerComposeYmlPath();
        await DockerClient.dockerComposeDown({ dockerComposePath: composeYmlFile });
    }




    async upgradeCluster(credentials) {
        const composeYmlFile = BrowserUpPaths.dockerComposeYmlPath();
        const secrets = ClusterSecretsProvider.get();
        log.debug("Shutting down existing cluster's services...");
        await DockerClient.dockerComposeDown({ dockerComposePath: composeYmlFile, removeVolumes: false, env: secrets });
        log.debug(`Pulling new images for target version: ${SERVICES_VERSION})`);
        await DockerClient.dockerComposePull({ dockerComposePath: composeYmlFile });
        const clusterParams = new LocalClusterParams({
            apiToken: credentials.apiToken,
            servicesImageTag: process.env.SERVICES_VERSION,
            standardImageTag: credentials.standardImageTag
        });
        await this.createCluster({ clusterParams: clusterParams });
    }

    get protocol() {
        return process.env.BROWSERUP_WEBCONSOLE_PROTOCOL || "http";
    }
}
