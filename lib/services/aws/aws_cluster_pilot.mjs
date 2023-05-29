//import { SSMClient, AddTagsToResourceCommand } from "@aws-sdk/client-ssm";
import "@aws-sdk/client-cloudformation";
import "./aws_ec2_client.mjs";

// stackType.js

import { randomBytes } from "crypto";
import "./aws_ec2_client.mjs";
import "./aws_cf_client.mjs";
import ora from "ora";
import {ClusterSecretsProvider} from "../cluster_secrets_provider.mjs";
import {ClusterCredentials} from "../../models/cluster_credentials.mjs";
import {ClusterType} from "../../models/cluster_type.mjs";
import AwsCfClient from "./aws_cf_client.mjs";
import { SERVICES_VERSION } from "../../browserup_cli.mjs";
import { v4 as uuidv4 } from 'uuid';
import {LocalEnvVars} from "../../utils/local_env_vars.mjs";
import {ClusterCredentialsRepository} from "../cluster_credentials_repository.mjs";
import {AwsEc2Client} from "./aws_ec2_client.mjs";

// constants.js
export const CLUSTER_STACK_TEMPLATE_FILE = 'clusterStackTemplate.yaml';
export const SERVICES_STACK_TEMPLATE_FILE = 'clusterServiceStackTemplate.yaml';
export const BROWSERUP_DOCKER_REPO = "docker.io/";
export const WEBCONSOLE_EXPOSED_PORT = 80;
export const DEFAULT_INGRESS_IP = '0.0.0.0';

// ResourceTag.js
export const ResourceTag = {
    CLUSTER_NAME: "BROWSERUP_CLUSTER_NAME",
    STACK_TYPE: "BROWSERUP_STACK_TYPE",
}

// StackType.js
export const StackType = {
    CLUSTER_ECS_SERVICES: "BROWSERUP_CLUSTER_ECS_SERVICES_STACK_TYPE",
    CLUSTER_ECS: "BROWSERUP_CLUSTER_ECS_STACK_TYPE",
    MINIONS_BU_STACK_UPDATE: "BROWSERUP_MINIONS_BU_STACK_UPDATE_STACK_TYPE",
    MINIONS_NETWORK_STACK: "BROWSERUP_MINIONS_NETWORK_STACK_TYPE",
    MINIONS_ECS: "BROWSERUP_MINIONS_ECS_STACK_TYPE",
}


export class AwsClusterPilot {

    getSshAccessToMinionFromIp(clusterParams, publicIp) {
        let sshAccessToMinionFromIp = DEFAULT_INGRESS_IP;
        if (clusterParams.minionsKeyPairName) {
            sshAccessToMinionFromIp = publicIp;
        }
        return sshAccessToMinionFromIp;
    }

    async getAmiForClusterInstance(amiType, region) {
        try {
            const ssmClient = new AWS.SSM({ region: region });
            const recommendedAmiParam = `/aws/service/ecs/optimized-ami/${amiType}/recommended/image_id`;
            const result = await ssmClient.getParameter({ Name: recommendedAmiParam }).promise();
            return result.Parameter.Value;
        } catch (e) {
            log.error(`Couldn"t get recommended ami for ecs cluster instance, ${e.message}`);
            throw e
        }
    }


    async createCluster({ clusterParams, clusterName }) {
        let spinner = ora({
            text: "Creating cluster...",
            spinner: "dots",
            discardStdin: false
        }).start();
        const secrets = ClusterSecretsProvider.get();
        try {
            let clusterCredentials = new ClusterCredentials({
                clusterUrl: '',
                clusterType: ClusterType.AWS,
                apiToken: clusterParams.apiToken,
                region: clusterParams.region,
                clusterName,
                standardImageTag: clusterParams.standardImageTag,
                servicesImageTag: clusterParams.servicesImageTag,
                isCustomServicesImageTag: clusterParams.isCustomServicesImageTag
            });

            const clusterStack = this.createClusterStack(clusterName, clusterParams, secrets);
            const clusterStackOutputs = this.getClusterStackOutputs(clusterStack);
            const nginxInstance = await AwsEc2Client.describeAsgInstance(clusterStackOutputs.nginxAsgId, clusterParams.region);
            const clusterPublicIp = nginxInstance.publicIpAddress;

            this.createServiceStack(clusterName, clusterStackOutputs, clusterPublicIp, clusterParams, secrets);
            const webconsoleUrl = `${secrets["WEBCONSOLE_PROTOCOL"]}://${clusterPublicIp}`;

            const grafanaClient = new GrafanaClient(
                webconsoleUrl,
                secrets['GRAFANA_PORT'],
                secrets['GRAFANA_USERNAME'],
                secrets['GRAFANA_PASSWORD']
            );

            await grafanaClient.createZookeeperDashboard();
            await grafanaClient.createDefaultDashboard();

            await waitForRailsReady(webconsoleUrl);
            log.info(`Service stack for cluster '${clusterName}' has been created successfully.`);

            clusterCredentials.clusterUrl = webconsoleUrl;
            ClusterCredentialsRepository.saveCredentials(clusterCredentials)

            return clusterCredentials;
        } catch (ex) {
            spinner.stop()
            log.error(`Failed to initialize cluster: '${clusterName}', region: '${clusterParams.region}': '${ex.message}'`);
            log.error("Any created stacks will be destroyed.");
            await this.destroyCluster({ clusterName, region: clusterParams.region });
            LocalEnvVars.clearSecrets()
            throw ex;
        }
    }

    async destroyCluster( clusterName, region ) {
        try {
            // ...
        } catch (e) {
            // Handle the error (logging, clearing secrets, etc.)
        }
    }

    async upgradeCluster(credentials, bypassConfirmation) {
        const newStackParams = {
            "ForceRecreateNginxFlag": uuidv4().substring(0, 8),
            "ServicesImageTag": SERVICES_VERSION
        };

        await AwsCfClient.updateStack({
            templateName: SERVICES_STACK_TEMPLATE_FILE,
            stackOptions: new AwsCfClient.StackOptions({
                name: `ServiceStack-${credentials.clusterName}`,
                params: newStackParams,
                tags: []
            }),
            region: credentials.region,
            changeSetName: await this.generateChangeSetName(),
            bypassConfirmation: bypassConfirmation
        });
    }

    async generateChangeSetName() {
        const servicesVersion = SERVICES_VERSION.replace(/\./g, "-");
        const randomString = uuidv4().substring(0, 5);
        return `UpgradeTo${servicesVersion}${randomString}`;
    }

    async getServicesImageTag(clusterParams) {
        let servicesImageTag = "latest";
        if (clusterParams.servicesImageTag !== null && clusterParams.servicesImageTag !== "") {
            servicesImageTag = clusterParams.servicesImageTag;
        }
        return servicesImageTag;
    }

    async getClusterStackOutputs(clusterStack) {
        return AwsCfClient.getStackOutputParams(
            clusterStack,
            {
                sgId: "SgId",
                vpcId: "VpcId",
                privateNamespaceId: "PrivateNamespaceId",
                nginxAsgId: "NginxAsgId",
                instanceProfileArn: "InstanceProfileArn",
                ecsInstanceRoleArn: "EcsInstanceRoleArn",
                privateSubnetIds: "PrivateSubnetIds",
                publicSubnetIds: "PublicSubnetIds",
                taskDefRoleArn: "TaskDefinitionsRoleArn"
            }
        );
    }

    async destroyBuClusterServices( clusterName, allRegionStacks, region ) {
        const buClusterServiceStacks = AwsCfClient.getStacksByTagsFilters(
            allRegionStacks,
            {
                [ResourceTag.STACK_TYPE]: StackType.CLUSTER_ECS_SERVICES,
                [ResourceTag.CLUSTER_NAME]: clusterName
            }
        );

        if (!buClusterServiceStacks) {
            log.info("Service stacks not present")
        }

        await this.deleteStacks({
            stacks: buClusterServiceStacks,
            region: region,
            waitFinish: true
        });
    }

    async destroyMinionsStacks(clusterName) {
        const regions = await getRegions();
        for (const region of regions) {
            await this.destroyMinionClustersInRegion(clusterName, region);
        }
    }

    async destroyMinionClustersInRegion(clusterName, region) {
        const allRegionStacks = await getAllStacks(region);
        const minionClusterStacks = await getStacksByTagsFilters(allRegionStacks, {
            [STACK_TYPE]: MINIONS_ECS,
            [CLUSTER_NAME]: clusterName,
        });

        if (minionClusterStacks.length > 0) {
            log.debug(`Found Minion cluster stacks in region: "${region}"`);
        }
        await this.deleteStacks({ stacks: minionClusterStacks, region, waitFinish: true });
    }

    async destroyMinionsUpdateBuClustersStacks(clusterName, allRegionStacks, region) {
        const buClusterUpdateStacks = await getStacksByTagsFilters(allRegionStacks, {
            [STACK_TYPE]: MINIONS_BU_STACK_UPDATE,
            [CLUSTER_NAME]: clusterName,
        });

        if (buClusterUpdateStacks.length > 0) {
            log.debug(`Found BrowserUp update cluster stacks in region: "${region}"`);
        }
        await this.deleteStacks({ stacks: buClusterUpdateStacks, region, waitFinish: true });
    }

    async destroyMinionsNetworkStacks(clusterName, allRegionStacks, region) {
        const minionNetworkStacks = await getStacksByTagsFilters(allRegionStacks, {
            [STACK_TYPE]: MINIONS_NETWORK_STACK,
            [CLUSTER_NAME]: clusterName,
        });

        if (minionNetworkStacks.length > 0) {
            log.debug(`Found Minion Network stacks in region: "${region}"`);
        }
        await this.deleteStacks({ stacks: minionNetworkStacks, region, waitFinish: true });
    }

    async destroyMinionsResources(clusterName, allRegionStacks, region) {
        log.debug("Destroying minion resources");
        await this.destroyMinionsStacks(clusterName);
        await this.destroyMinionsUpdateBuClustersStacks(clusterName, allRegionStacks, region);
        await this.destroyMinionsNetworkStacks(clusterName, allRegionStacks, region);
    }

    async destroyBrowserUpClusterEcs(clusterName, allRegionStacks, region) {
        log.debug("Destroying BrowserUp ECS cluster");
        const buClusterStacks = await getStacksByTagsFilters(allRegionStacks, {
            [STACK_TYPE]: CLUSTER_ECS,
            [CLUSTER_NAME]: clusterName,
        });

        if (buClusterStacks.length > 0) {
            log.debug(`Found BrowserUp ECS cluster stacks in region: "${region}"`);
        }
        await this.deleteStacks({ stacks: buClusterStacks, region, waitFinish: true });
    }

    async findClusterRegionByName(clusterName) {
        const regions = await getRegions();

        for (const region of regions) {
            const allStacks = await getAllStacks(region);
            const filteredStacks =   await getStacksByTagsFilters(allStacks, {
                [STACK_TYPE]: CLUSTER_ECS,
                [CLUSTER_NAME]: clusterName,
            });

            if (filteredStacks.length > 0) {
                return region;
            }
        }
        return null;
    }

    async deleteStacks( stacks, region, waitFinish = false ) {
        if (stacks.length === 0) return;
        for (const stack of stacks) {
            await this.deleteStack(stack.stackId, region);
        }
        if (waitFinish) {
            await waitForStacksToDestroy(region, stacks);
        }
    }

    async deleteStack(stackId, region) {
        const cfClient = new AWS.CloudFormation({ region: region });
        try {
            await cfClient.deleteStack({ StackName: stackId }).promise();
        } catch (e) {
            log.error(`Error while deleting stack (stack id: ${stackId}): ${e.message}`);
        }
    }

    async createClusterStack(clusterName, clusterParams, secrets) {
        try {
            log.info(`Creating Cluster stack for cluster: "${clusterName}", region "${clusterParams.region}"...`);
            log.info("Sending Cluster stack create request...");
            const createdClusterStackInfo = await this.requestCreateClusterStack(clusterName, clusterParams, secrets);
            log.info("Waiting for Cluster stack to be deployed...");
            const createdStack = await AwsCfClient.waitForStack(createdClusterStackInfo, clusterParams.region);
            log.info("Cluster stack has been created successfully.");
            return createdStack;
        } catch (e) {
            log.error(`Failed to create Cluster stack: ${e.message}`);
            throw e;
        }
    }

    async requestCreateClusterStack(clusterName, clusterParams, secrets) {
        let publicIp = await getPublicIp() || DEFAULT_INGRESS_IP;

        let sshAccessToClusterFromIp = DEFAULT_INGRESS_IP;
        if (clusterParams.keyPairName) {
            sshAccessToClusterFromIp = publicIp;
        }
        let wcPort = secrets["WEBCONSOLE_PROTOCOL"] === 'http' ? '80' : '443';
        let stackParams = {
            "PrivateDnsNamespaceName": secrets[PRIVATE_DNS_NAMESPACE_NAME],
            "S3MinioIngressPort": secrets[S3_MINIO_HOST_PORT_1],
            "WcIngressPort": wcPort,
            "GrafanaIngressPort": secrets[GRAFANA_PORT],
            "KeyName": clusterParams.keyPairName || '',
            "VpcAvailabilityZones": await availabilityZones(clusterParams.region),
            "EcsClusterName": clusterName,
            "X86AmiId": await getAmiForClusterInstance('amazon-linux-2', clusterParams.region),
            "Arm64AmiId": await getAmiForClusterInstance('amazon-linux-2/arm64', clusterParams.region),
            "AllowSshAccessToClusterFromCidr": `${sshAccessToClusterFromIp}/32`,
            "GrafanaDatasourceYaml": await readAwsResource("grafana-datasource.yaml"),
            "GrafanaDashboardsProviderYaml": await readAwsResource("grafana-dashboards-provider.yaml"),
            "FluentBitConfig": await readAwsResource("fluent-bit.conf"),
            "LokiConfig": await readAwsResource("loki-config.yaml"),
            "PrometheusConfig": await readAwsResource("prometheus.yml"),
            "ZookeeperConfig": await readAwsResource("zoo.cfg"),
        };
        let stackTags = {
            [CLUSTER_NAME]: clusterName,
            [STACK_TYPE]: CLUSTER_ECS
        };
        await createStack(
            {
                templateName: CLUSTER_STACK_TEMPLATE_FILE,
                stackOptions: new StackOptions({
                    name: `ClusterStack-${clusterName}`,
                    params: stackParams,
                    tags: stackTags
                }),
                region: clusterParams.region
            }
        );
    }

    async createServiceStack(clusterName, clusterStackOutputs, clusterPublicIp, clusterParams, secrets) {
        try {
            const region = clusterParams.region;
            log.info(`Creating Service stack for cluster: "${clusterName}", region "${region}"...`);
            const serviceStackInfo = await this.requestCreateServiceStack(clusterName, clusterStackOutputs, clusterPublicIp, clusterParams, secrets);
            log.debug("Waiting for Service stack to be deployed...");
            await AwsCfClient.waitForStack({
                stackInfo: serviceStackInfo,
                region: region
            });
        } catch (e) {
            log.error(`Failed to set up Cluster Service stack: ${e.message}`);
            throw e;
        }
    }

    async requestCreateServiceStack(clusterName, clusterStackOutputs, clusterPublicIp, clusterParams, secrets) {
        const publicIp = (await NetHTTPUtils.getPublicIp()) || DEFAULT_INGRESS_IP;
        const sshAccessToMinionFromIp = this.getSshAccessToMinionFromIp(clusterParams, publicIp);
        const stackParams = {
            "AdminEmails": clusterParams.adminEmails.join(","),
            "PrivateDnsNamespaceName": secrets["PRIVATE_DNS_NAMESPACE_NAME"],
            "PrivateNamespaceId": clusterStackOutputs.privateNamespaceId,
            "InstanceProfileArn": clusterStackOutputs.instanceProfileArn,
            "EcsInstanceRoleArn": clusterStackOutputs.ecsInstanceRoleArn,
            "TaskDefinitionsRoleArn": clusterStackOutputs.taskDefRoleArn,
            "PrivateSubnetIDs": clusterStackOutputs.privateSubnetIds,
            "PublicSubnetIDs": clusterStackOutputs.publicSubnetIds,
            "ClusterSgId": clusterStackOutputs.sgId,
            "ClusterName": clusterName,
            "ClusterVpcId": clusterStackOutputs.vpcId,
            "AwsSecretAccessKey": process.env.AWS_SECRET_ACCESS_KEY,
            "AwsAccessKeyId": process.env.AWS_ACCESS_KEY_ID,
            "InitialApiToken": clusterParams.apiToken,
            "MinionsKeyName": clusterParams.minionsKeyPairName || "",
            "S3MinioSecretAccessKeyID": secrets["S3_MINIO_SECRET_ACCESS_KEY"],
            "S3MinioAccessKeyID": secrets["S3_MINIO_ACCESS_KEY_ID"],
            "S3MinioIngressPort": secrets["S3_MINIO_HOST_PORT_1"],
            "AllowSshAccessToMinionFromCidr": `${sshAccessToMinionFromIp}/32`,
            "WebconsoleProtocol": secrets["WEBCONSOLE_PROTOCOL"],
            "WcIngressPort": secrets["WEBCONSOLE_PROTOCOL"] === "http" ? "80" : "443",
            "GrafanaIngressPort": secrets["GRAFANA_PORT"],
            "ServicesImageTag": this.getServicesImageTag(clusterParams),
            "ClusterPublicIP": clusterPublicIp,
            "StandardImageVersionTag": clusterParams.standardImageTag,
            "ForceRecreateNginxFlag": randomBytes(4).toString("hex"),
        };
        const stackTags = { [ResourceTag.CLUSTER_NAME]: clusterName,
            [ResourceTag.STACK_TYPE]: StackType.CLUSTER_ECS_SERVICES };
        return AwsCfClient.createStack({
            templateName: SERVICES_STACK_TEMPLATE_FILE,
            stackOptions: new AwsCfClient.StackOptions({ name: `ServiceStack-${clusterName}`, params: stackParams, tags: stackTags }),
            region: clusterParams.region
        });
    }
}
