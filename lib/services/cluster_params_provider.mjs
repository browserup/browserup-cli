//import { Enum } from 'enumify';
//class ClusterType extends Enum {}
//ClusterType.initEnum(['AWS', 'Local']);

import  "../utils/token_generator.mjs";
import "../models/cluster_type.mjs";

const EMAIL_REGEXP = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export class ClusterParamsProvider {

    static createClusterParams(cliOptions) {
        const clusterType = cliOptions.cluster_type;
        const adminEmails = cliOptions.admin_emails;
        this.validateClusterType(clusterType);
        this.validateAdminEmails(adminEmails);
        const apiToken = TokenGenerator.friendlyToken();
        let clusterParams;

        if (clusterType === ClusterType.AWS) {
            clusterParams = new RemoteClusterParams({
                apiToken,
                instanceType: cliOptions.instance,
                region: cliOptions.region,
                adminEmails: cliOptions.admin_emails,
                keyPairName: cliOptions.key_pair,
                minionsKeyPairName: cliOptions.minions_key_pair,
                createKeyPair: cliOptions.create_key_pair,
                servicesImageTag: cliOptions.servicesImageTag,
                standardImageTag: cliOptions.standard_image_tag,
            });
        } else {
            clusterParams = new LocalClusterParams({
                apiToken,
                servicesImageTag: cliOptions.servicesImageTag,
                standardImageTag: cliOptions.standard_image_tag,
            });
        }
        return clusterParams;
    }

    static validateClusterType(clusterType) {
        if (!this.CLUSTER_TYPES.includes(clusterType)) {
            throw new Error(
                `Invalid 'cluster_type' provided, possible options: ${this.CLUSTER_TYPES.join(',')}`
            );
        }
    }

    static validateAdminEmails(adminEmails) {
        if (adminEmails === null) {
            return;
        }
        if (!Array.isArray(adminEmails)) {
            throw new Error("Invalid 'admin_emails' provided, expected array");
        }
        adminEmails.forEach((adminEmail) => this.validateAdminEmail(adminEmail));
    }

    static validateAdminEmail(adminEmail) {
        if (!EMAIL_REGEXP.test(adminEmail)) {
            throw new Error(
                `Invalid 'admin_emails' provided, invalid email found: '${adminEmail}'`
            );
        }
    }
}
