//import { Enum } from "enumify";
//class ClusterType extends Enum {}
//ClusterType.initEnum(["AWS", "Local"]);

import  "../utils/token_generator.mjs";
import "../models/cluster_type.mjs";
import {ClusterType} from "../models/cluster_type.mjs";
import {RemoteClusterParams} from "../models/remote_cluster_params.mjs";
import {LocalClusterParams} from "../models/local_cluster_params.mjs";
import {TokenGenerator} from "../utils/token_generator.mjs";
import { decoratedError } from "../browserup_errors.mjs";

const EMAIL_REGEXP = /^[a-zA-Z0-9.!#$%&"*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export class ClusterParamsProvider {

    static createClusterParams(cliOptions) {
        const clusterType = cliOptions.clusterType;
        const adminEmails = cliOptions.adminEmails;
        this.validateClusterType(clusterType);
        this.validateAdminEmails(adminEmails);
        const apiToken = TokenGenerator.friendlyToken();
        let clusterParams;

        if (clusterType === ClusterType.AWS) {
            clusterParams = new RemoteClusterParams({
                apiToken,
                instanceType: cliOptions.instance,
                region: cliOptions.region,
                adminEmails: cliOptions.adminEmails,
                keyPairName: cliOptions.keyPair,
                minionsKeyPairName: cliOptions.minionKeyPair,
                servicesImageTag: cliOptions.servicesImageTag,
                standardImageTag: cliOptions.standardImageTag,
            });
        } else {
            clusterParams = new LocalClusterParams({
                apiToken,
                servicesImageTag: cliOptions.servicesImageTag,
                standardImageTag: cliOptions.standardImageTag,
                useLocalCache: cliOptions.useLocalCache
            });
        }
        return clusterParams;
    }

    static validateClusterType(clusterType) {
        if (!Object.values(ClusterType).includes(clusterType)) {
            throw decoratedError(
                `Invalid "clusterType" provided, possible options: ${ClusterType.join(",")}`
            );
        }
    }

    static validateAdminEmails(adminEmails) {
        if (adminEmails === null) {
            return;
        }
        if (!Array.isArray(adminEmails)) {
            throw decoratedError("Invalid \"admin_emails\" provided, expected array");
        }
        adminEmails.forEach((adminEmail) => this.validateAdminEmail(adminEmail));
    }

    static validateAdminEmail(adminEmail) {
        if (!EMAIL_REGEXP.test(adminEmail)) {
            throw decoratedError(
                `Invalid "admin_emails" provided, invalid email found: "${adminEmail}"`
            );
        }
    }
}
