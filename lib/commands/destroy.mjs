import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {LocalClusterPilot} from "../services/local_cluster_pilot.mjs";
import {AwsClusterPilot} from "../services/aws/aws_cluster_pilot.mjs";
import {ClusterSecretsProvider} from "../services/cluster_secrets_provider.mjs";
import {LocalEnvVars} from "../utils/local_env_vars.mjs";
import {AwsCredentialsValidator} from "../services/aws/aws_credentials_validator.mjs";

import chalk from "chalk";
import ora from "ora";
import {logAndExit} from "../utils/cli_helpers.mjs";
import {decoratedError, ErrorType} from "../browserup_errors.mjs";


export async function destroy(options, program_opts) {
    let credentials;
    log.debug("Running Destroy");
    try {
        credentials = await ClusterCredentialsRepository.getCredentials(options, ["clusterName"]);
    } catch (e) {
        if (e.type === ErrorType.INVALID_CLUSTER_CREDENTIALS) {
            log.info("Cluster credentials indicating a cluster are not present in secrets");
            log.info("It seems there's nothing to destroy. ");
            log.info("Clearing Secrets since they are invalid.");
            ClusterCredentialsRepository.clearCredentials();
            return true;
        }
    }
    ExistingClusterValidator.validate(credentials);

    const spinner = ora(`Destroying ${credentials.clusterType} cluster...`).start();

    try {
        if (credentials.localCluster()) {
            await destroyLocal( true,  "" );
        } else {
            await destroyRemote(credentials);
        }
    } catch (e) {
       return logAndExit(e.message, e);
    }
    finally {
        spinner.stop();
    }

    log.info(chalk.green(`Destroyed cluster: ${JSON.stringify(credentials)}.`));
    log.debug("Clearing secrets...");
    LocalEnvVars.clearSecrets();

    spinner.stop();
    log.info("Destroy cluster completed successfully");
}

export async function destroyLocal(removeVolumes) {
    const localClusterPilot = new LocalClusterPilot();
    await localClusterPilot.destroyCluster({
        clusterName: "",
        removeVolumes: removeVolumes,
        region: "",
    });
}

export async function destroyRemote(credentials) {
    log.debug ("Destroy Remote cluster");
    AwsCredentialsValidator.validateCredentials();
    const awsClusterPilot = new AwsClusterPilot();
    awsClusterPilot.destroyCluster({
        clusterName: credentials.clusterName,
        region: credentials.region,
    }).then((data) => {}    )
        .catch((err) => {
            log.error(err.message);
            return logAndExit("Failed to destroy cluster", err);});
    log.debug ("Destroy remote cluster completed successfully");
}
