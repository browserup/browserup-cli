import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

export class AwsEc2Client {
    static async availabilityZones(region) {
        const ec2 = new AWS.EC2({ region });
        const azsResp = await ec2.describeAvailabilityZones().promise();
        return azsResp.AvailabilityZones.map((az) => az.ZoneName).join(",");
    }

    static async describeAsgInstance(asgName, region) {
        const asgInstanceId = await this.getInstanceIdFromAsg(asgName, region);
        return this.describeInstance(asgInstanceId, region);
    }

    static async describeInstance(instanceId, region) {
        const ec2 = new AWS.EC2({ region });
        const response = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
        return response.Reservations[0].Instances[0];
    }

    static async getInstanceIdFromAsg(asgName, region) {
        const autoscaling = new AWS.AutoScaling({ region });
        const response = await autoscaling
            .describeAutoScalingGroups({ AutoScalingGroupNames: [asgName] })
            .promise();
        return response.AutoScalingGroups[0].Instances[0].InstanceId;
    }

    static async getRegions() {
        const ec2 = new AWS.EC2();
        try {
            const response = await ec2.describeRegions().promise();
            return response.Regions.map((regionData) => regionData.RegionName);
        } catch (ex) {
            throw new Error(`Failed to get regions: ${ex.message}`);
        }
    }

    static async createKeyPair(keyPairName, region) {
        const ec2 = new AWS.EC2({ region });
        try {
            const keyPair = await ec2.createKeyPair({ KeyName: keyPairName }).promise();
            log.info(`Created key pair "${keyPair.KeyName}".`);
            const filename = path.join(process.cwd(), `${keyPair.KeyName}.pem`);
            fs.writeFileSync(filename, keyPair.KeyMaterial);
            log.info(`Private key file saved to secrets (${keyPair.KeyName}.pem)`);
        } catch (e) {
            if (e.code === "InvalidKeyPair.Duplicate") {
                throw new Error(`Error creating AWS Key Pair: a key pair named "${keyPairName}" already exists.`);
            } else {
                throw new Error(`Error creating AWS Key Pair or saving private key file: ${e.message}`);
            }
        }
    }
}
