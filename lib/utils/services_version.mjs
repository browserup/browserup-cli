import { parse, compare } from "semver";

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

    static isCliOlderThanCluster(clusterServicesVersion, browserupCliServicesVersion) {
        const result = this.compareReleases(clusterServicesVersion, browserupCliServicesVersion);
        return result === 1;
    }

    static isCliNewerThanCluster(clusterServicesVersion, browserupCliServicesVersion) {
        const result = this.compareReleases(clusterServicesVersion, browserupCliServicesVersion);
        return result === -1;
    }

    static isCliTheSameAsCluster(clusterServicesVersion, browserupCliServicesVersion) {
        const result = this.compareReleases(clusterServicesVersion, browserupCliServicesVersion);
        return result === 0;
    }
}
