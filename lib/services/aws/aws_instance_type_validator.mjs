import AWS from "aws-sdk";
export class AwsInstanceTypeValidator {
    static async validateInstanceType(instanceType, region) {
        const ec2 = new AWS.EC2({ region });

        let nextToken;
        let allInstances = [];

        do {
            const response = await ec2.describeInstanceTypes({ NextToken: nextToken }).promise();
            nextToken = response.NextToken;
            allInstances = allInstances.concat(response.InstanceTypes);
        } while (nextToken);

        const found = allInstances.some(awsInstanceType => awsInstanceType.InstanceType === instanceType);

        if (!found) {
            throw new Error(`Failed to find instance type: "${instanceType}" in region: "${region}"`);
        }
    }
}

module.exports = AwsInstanceTypeValidator;
