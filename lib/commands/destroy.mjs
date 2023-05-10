import {ClusterCredentialsRepository} from "../services/cluster_credentials_repository.mjs";
import {ExistingClusterValidator} from "../services/existing_cluster_validator.mjs";
import {LocalClusterPilot} from "../services/local_cluster_pilot.mjs";
import {AwsClusterPilot} from "../services/aws/aws_cluster_pilot.mjs";
import {Secrets} from "../models/secrets.mjs";
import {ClusterSecretsProvider} from "../services/cluster_secrets_provider.mjs";
import '../utils/local_env_vars.mjs';

import {InvalidClusterCredentials} from '../exceptions.mjs';
import chalk from 'chalk';
import ora from 'ora';


export async function destroy(options) {
    let credentials;
    log.debug('Running Destroy');
    try {
        credentials = await ClusterCredentialsRepository.getCredentials({
            options,
            requiredFields: ['cluster_name'],
        });
    } catch (e) {
        throw new InvalidClusterCredentials(`${e.message}`);
    }
    ExistingClusterValidator.validate(credentials);

    const spinner = ora(`Destroying ${credentials.cluster_type} cluster...`).start();

    if (credentials.local_cluster) {
        await this.destroyLocal(true);
    } else {
        await this.destroyRemote(credentials);
    }
    log.info(chalk.green(`Destroyed cluster: ${JSON.stringify(credentials)}.`));
    log.debug('Clearing secrets...');
    let secrets = ClusterSecretsProvider.get()
    secrets.clearSecrets();
    spinner.stop();
    log.info('Destroy cluster completed successfully');
}

export async function destroyLocal(removeVolumes) {
    const localClusterPilot = new LocalClusterPilot();
    await localClusterPilot.destroyCluster({
        cluster_name: '',
        remove_volumes: removeVolumes,
        region: '',
    });
}

export async function destroyRemote(credentials) {
    await validateCredentials();
    const awsClusterPilot = new AwsClusterPilot();
    await awsClusterPilot.destroyCluster({
        cluster_name: credentials.cluster_name,
        region: credentials.region,
    });
}
