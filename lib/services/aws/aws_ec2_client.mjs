import { AutoScaling } from "@aws-sdk/client-auto-scaling";
import { EC2 } from "@aws-sdk/client-ec2";
import fs from "fs";
import path from "path";
import { decoratedError } from "../browserup_errors.mjs";

export class AwsEc2Client {
    static async availabilityZones(region) {
        const ec2 = new EC2({ region });
        const azsResp = await ec2.describeAvailabilityZones();
        return azsResp.AvailabilityZones.map((az) => az.ZoneName).join(",");
    }

    static async describeAsgInstance(asgName, region) {
        const asgInstanceId = await this.getInstanceIdFromAsg(asgName, region);
        return this.describeInstance(asgInstanceId, region);
    }

    static async describeInstance(instanceId, region) {
        const ec2 = new EC2({ region });
        const response = await ec2.describeInstances({ InstanceIds: [instanceId] });
        return response.Reservations[0].Instances[0];
    }

    static async getInstanceIdFromAsg(asgName, region) {
        const autoscaling = new AutoScaling({ region });
        const response = await autoscaling
            .describeAutoScalingGroups({ AutoScalingGroupNames: [asgName] });
        return response.AutoScalingGroups[0].Instances[0].InstanceId;
    }

    static async getRegions() {
        const ec2 = new EC2();
        try {
            const response = await ec2.describeRegions();
            return response.Regions.map((regionData) => regionData.RegionName);
        } catch (e) {
            throw decoratedError(`Failed to get regions: ${e.message}`);
        }
    }

    static async createKeyPair(keyPairName, region) {
        const ec2 = new EC2({ region });
        try {
            const keyPair = await ec2.createKeyPair({ KeyName: keyPairName });
            log.info(`Created key pair "${keyPair.KeyName}".`);
            const filename = path.join(process.cwd(), `${keyPair.KeyName}.pem`);
            fs.writeFileSync(filename, keyPair.KeyMaterial);
            log.info(`Private key file saved to secrets (${keyPair.KeyName}.pem)`);
        } catch (e) {
            if (e.code === "InvalidKeyPair.Duplicate") {
                throw decoratedError(`Error creating AWS Key Pair: a key pair named "${keyPairName}" already exists.`);
            } else {
                throw decoratedError(`Error creating AWS Key Pair or saving private key file: ${e.message}`);
            }
        }
    }
}
