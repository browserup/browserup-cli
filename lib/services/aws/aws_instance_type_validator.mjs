import { EC2 } from "@aws-sdk/client-ec2";
export class AwsInstanceTypeValidator {
    static async validateInstanceType(instanceType, region) {
        const ec2 = new EC2({ region });

        let nextToken;
        let allInstances = [];

        do {
            const response = await ec2.describeInstanceTypes({ NextToken: nextToken });
            nextToken = response.NextToken;
            allInstances = allInstances.concat(response.InstanceTypes);
        } while (nextToken);

        const found = allInstances.some(awsInstanceType => awsInstanceType.InstanceType === instanceType);

        if (!found) {
            throw decoratedError(`Failed to find instance type: "${instanceType}" in region: "${region}"`);
        }
    }
}

module.exports = AwsInstanceTypeValidator;
