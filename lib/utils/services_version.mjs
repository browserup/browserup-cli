import { parse, compare } from "semver";
import {SERVICES_VERSION} from "../browserup_cli.mjs";

export class ServicesVersion {
    static isRelease(version) {
        const regex = /^release-\d+\.\d+\.\d+$/;
        return regex.test(version);
    }

    static compareReleases(release1, release2) {
        const v1 = parse(release1.replace(/^release-/, ""));
        const v2 = parse(release2.replace(/^release-/, ""));
        return compare(v1, v2);
    }

    static isCliOlderThanCluster(clusterServicesVersion) {
        const result = this.compareReleases(clusterServicesVersion, SERVICES_VERSION);
        return result === 1;
    }

    static isCliNewerThanCluster(clusterServicesVersion) {
        const result = this.compareReleases(clusterServicesVersion, SERVICES_VERSION);
        return result === -1;
    }

    static isCliTheSameAsCluster(clusterServicesVersion) {
        const result = this.compareReleases(clusterServicesVersion, SERVICES_VERSION);
        return result === 0;
    }
}
