// Assuming Utils is in the same directory
import { ServicesVersion } from "../utils/services_version.mjs";
export class ExistingClusterValidator {
    static validate(credentials) {
        if (credentials.isCustomServicesImageTag) {
            return true;
        }

        if (!ServicesVersion.isRelease(credentials.servicesImageTag)) {
            return true;
        }

        if (ServicesVersion.isCliOlderThanCluster(credentials.servicesImageTag)) {
            throw decoratedError({msg: `Cluster newer than CLI: ${credentials.servicesImageTag}`, type: ErrorType.CLUSTER_NEWER_THAN_CLI});
        }

        if (ServicesVersion.isCliNewerThanCluster(credentials.servicesImageTag)) {
            throw new ClusterOlderThanCLI(credentials.servicesImageTag);
            throw decoratedError({msg: `Cli is newer than cluster: ${credentials.servicesImageTag}`, type: ErrorType.CLUSTER_OLDER_THAN_CLI});
        }

        return true;
    }
}
