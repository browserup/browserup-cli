import chalk from "chalk";
import ora from "ora";

import {ClusterSecretsProvider} from "../services/cluster_secrets_provider.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ClusterParamsProvider} from "../services/cluster_params_provider.mjs";
import {LocalClusterPilot} from "../services/local_cluster_pilot.mjs";
import {ClusterNameGenerator} from "../services/cluster_name_generator.mjs";
import {AwsClusterPilot} from "../services/aws/aws_cluster_pilot.mjs";
import {AwsEc2Client} from "../services/aws/aws_ec2_client.mjs";
import {AwsKeyPairValidator} from "../services/aws/aws_key_pair_validator.mjs";
import {AwsCredentialsValidator} from "../services/aws/aws_credentials_validator.mjs";

export async function deploy(options, program_opts) {
    log.debug("Running Deploy");
    await this.checkClusterAlreadyExists(options);
    const clusterParams = this.parseDeployOptions(options);
    log.info(`Deploying ${chalk.green(clusterParams.clusterType)} cluster`);
    const secrets = ClusterSecretsProvider.get();
    const clusterCredentials = clusterParams.isLocal()
        ? this.deployLocalCluster(clusterParams)
        : clusterParams.isRemote()
            ? this.deployRemoteCluster(clusterParams)
            : null;

    log.debug(
        `Logs are available at: ${this.protocol()}://${clusterCredentials.clusterHost}:${secrets["GRAFANA_PORT"]}`
    );
    log.info(`Deploy cluster completed successfully, webconsole URL: ${clusterCredentials.clusterUrl}`);
    return clusterCredentials;
}

function protocol() {
    return process.env.WEBCONSOLE_PROTOCOL || "http";
}

async function deployLocalCluster(clusterParams)
{
    return new LocalClusterPilot().createCluster({clusterParams, clusterName: ""});
}

async function checkClusterAlreadyExists(options) {
    const credentials = await ClusterCredentialsRepository.getCredentials({
        options,
        requiredFields: [],
    });

    if (credentials.clusterUrl) {
        throw new Error(`Found existing cluster: ${credentials.clusterUrl}`);
    }
}

function parseDeployOptions(options)
{
    return ClusterParamsProvider.createClusterParams(options);
}

async function deployRemoteCluster(clusterParams)
{
    log.info("Creating new cluster...");
    const clusterName = ClusterNameGenerator.generateClusterName("remote");

    await this.validateClusterParams(clusterParams);
    return new AwsClusterPilot().createCluster({clusterParams, clusterName});
}

async function validateClusterParams(clusterParams)
{
    let spinner = ora({
        text: "Running validations...",
        spinner: "dots",
        discardStdin: false
    }).start();

    const isKeyPairProvided = !!(clusterParams.keyPairName && clusterParams.keyPairName.trim());

    try {
        if (clusterParams.createKeyPair === "true") {
            await AwsEc2Client.createKeyPair({
                keyPairName: clusterName,
                region: clusterParams.region,
            });
            clusterParams.keyPairName = clusterName;
        } else if (isKeyPairProvided) {
            try {
                log.debug("Validating Key Pair name...");
                await AwsKeyPairValidator.validateKeyPairName({
                    keyPairName: clusterParams.keyPairName,
                    region: clusterParams.region,
                });
            } catch (err) {
                throw new Error("Invalid Key Pair provided");
            }
        }
        await AwsCredentialsValidator.validateCredentials();
    } finally {
        spinner.stop();
    }
}
