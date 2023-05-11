import "../models/cluster_type.mjs";
import {TokenGenerator} from "../utils/token_generator.mjs";
//import Utils from "./utils";

const CLUSTER_NAME_LOCAL_PREFIX = "local-cluster";
const CLUSTER_NAME_PREFIX = "production-cluster-";

export class ClusterNameGenerator {
    static generateClusterName(clusterType) {
        if (clusterType === ClusterType.LOCAL) {
            return CLUSTER_NAME_LOCAL_PREFIX;
        } else {
            return `${CLUSTER_NAME_PREFIX}Cluster-${TokenGenerator.friendlyToken(6)}`;
        }
    }
}
