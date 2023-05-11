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
            throw new ClusterNewerThanCLI(credentials.servicesImageTag);
        }

        if (ServicesVersion.isCliNewerThanCluster(credentials.servicesImageTag)) {
            throw new ClusterOlderThanCLI(credentials.servicesImageTag);
        }

        return true;
    }
}
