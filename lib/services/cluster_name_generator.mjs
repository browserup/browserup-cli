import {ClusterType} from "../models/cluster_type.mjs";
import {TokenGenerator} from "../utils/token_generator.mjs";
import {CLUSTER_NAME_LOCAL_PREFIX, CLUSTER_NAME_PREFIX} from "../constants.mjs";


export class ClusterNameGenerator {
    static generateClusterName(clusterType) {
        if (clusterType === ClusterType.LOCAL) {
            return CLUSTER_NAME_LOCAL_PREFIX;
        } else {
            return `${CLUSTER_NAME_PREFIX}Cluster-${TokenGenerator.friendlyToken(6)}`;
        }
    }
}
