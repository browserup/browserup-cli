import chalk from "chalk";

import {ClusterSecretsProvider} from "../services/cluster_secrets_provider.mjs";
import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ClusterParamsProvider} from "../services/cluster_params_provider.mjs";
import {LocalClusterPilot} from "../services/local_cluster_pilot.mjs";
import {ClusterNameGenerator} from "../services/cluster_name_generator.mjs";
import {AwsClusterPilot} from "../services/aws/aws_cluster_pilot.mjs";
import {AwsEc2Client} from "../services/aws/aws_ec2_client.mjs";
import {AwsKeyPairValidator} from "../services/aws/aws_key_pair_validator.mjs";
import {AwsCredentialsValidator} from "../services/aws/aws_credentials_validator.mjs";
import {decoratedError, ErrorType} from "../browserup_errors.mjs";
import {LogSpinner} from "../utils/log_spinner.mjs";
import { checkLocalPortsAreFree } from "../utils/check_local_ports_are_free.mjs";
import { EOL } from 'node:os'

export async function deploy(options, _programOpts) {
    log.debug("Running Deploy");
    await checkClusterAlreadyExists(options);
    const clusterParams = ClusterParamsProvider.createClusterParams(options);
    log.info(`Deploying ${chalk.green(clusterParams.clusterType)} cluster`);
    const secrets = ClusterSecretsProvider.get();
    let clusterCredentials;

    if (clusterParams.isLocal()) {
        let portProblemMessages = await checkLocalPortsAreFree();
        if (portProblemMessages.length > 0) {
            log.info(chalk.red("Error local ports in use:"));
            log.info(portProblemMessages);
            log.info(chalk.red(portProblemMessages.join(EOL)));
        }
        clusterCredentials = await deployLocalCluster(clusterParams);
    } else if (clusterParams.isRemote()) {
        clusterCredentials = await deployRemoteCluster(clusterParams);
    } else {
        throw decoratedError("Unknown cluster type")
    }

    log.info(
        `Logs are available at: ${protocol()}://${clusterCredentials.clusterHost()}:${secrets["GRAFANA_PORT"]}`
    );
    log.info(`Deploy cluster completed successfully, webconsole URL: ${clusterCredentials.clusterUrl}`);
    return clusterCredentials;
}

function protocol() {
    return process.env.WEBCONSOLE_PROTOCOL || "http";
}

async function deployLocalCluster(clusterParams)
{
    return new LocalClusterPilot().createCluster({ clusterParams: clusterParams });
}

async function checkClusterAlreadyExists(options) {
    const credentials = ClusterCredentialsRepository.getCredentials(
        options,
        []);

    if (credentials.clusterUrl) {
        throw decoratedError({msg: `Found existing cluster: ${credentials.clusterUrl}`, type: ErrorType.CLUSTER_ALREADY_EXISTS });
    }
    return credentials;
}

async function deployRemoteCluster(clusterParams)
{
    log.info("Creating new cluster...");
    const clusterName = ClusterNameGenerator.generateClusterName("remote");

    await validateClusterParams(clusterParams);
    return new AwsClusterPilot().createCluster({ clusterParams: clusterParams, clusterName: clusterName });
}

async function validateClusterParams(clusterParams)
{
    LogSpinner.start("Running validations...")

    try {
        if (clusterParams.keyPairName !== undefined) {
            try {
                log.debug("Validating Key Pair name...");
                await AwsKeyPairValidator.validateKeyPairName(clusterParams.keyPairName, clusterParams.region);
            } catch (e) {
                throw decoratedError({error: e, msg: 'Invalid Key Pair', type: ErrorType.INVALID_KEY_PAIR});
            }
        }
        await AwsCredentialsValidator.validateCredentials();
    } finally {
        LogSpinner.stop();
    }
}
