import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {LocalClusterPilot} from "../services/local_cluster_pilot.mjs";
import {AwsClusterPilot} from "../services/aws/aws_cluster_pilot.mjs";
import {Secrets} from "../models/secrets.mjs";
import {ClusterSecretsProvider} from "../services/cluster_secrets_provider.mjs";
import {LocalEnvVars} from "../utils/local_env_vars.mjs";
import {AwsCredentialsValidator} from "../services/aws/aws_credentials_validator.mjs";

import {InvalidClusterCredentials} from "../exceptions.mjs";
import chalk from "chalk";
import ora from "ora";
import {logAndExit} from "../utils/cli_helpers.mjs";


export async function destroy(options, program_opts) {
    let credentials;
    log.debug("Running Destroy");
    try {
        credentials = await ClusterCredentialsRepository.getCredentials({
            options,
            requiredFields: ["cluster_name"],
        });
    } catch (e) {
        throw new InvalidClusterCredentials(`${e.message}`);
    }
    ExistingClusterValidator.validate(credentials);

    const spinner = ora(`Destroying ${credentials.cluster_type} cluster...`).start();

    try {
        if (credentials.local_cluster) {
            await destroyLocal(true);
        } else {
            await destroyRemote(credentials);
        }
    } catch (e) {
        spinner.stop();
       return logAndExit(e.message, e);
    }

    log.info(chalk.green(`Destroyed cluster: ${JSON.stringify(credentials)}.`));
    log.debug("Clearing secrets...");
    let secrets = ClusterSecretsProvider.get()
    secrets.clearSecrets();
    spinner.stop();
    log.info("Destroy cluster completed successfully");
}

export async function destroyLocal(removeVolumes) {
    const localClusterPilot = new LocalClusterPilot();
    await localClusterPilot.destroyCluster({
        cluster_name: "",
        remove_volumes: removeVolumes,
        region: "",
    });
}

export async function destroyRemote(credentials) {
    log.debug ("Destroy Remote cluster");
    AwsCredentialsValidator.validateCredentials();
    const awsClusterPilot = new AwsClusterPilot();
    awsClusterPilot.destroyCluster({
        cluster_name: credentials.cluster_name,
        region: credentials.region,
    }).then((data) => {}    )
        .catch((err) => {
            log.error(err.message);
            return logAndExit("Failed to destroy cluster", err);});
    log.debug ("Destroy cluster completed successfully");
}
