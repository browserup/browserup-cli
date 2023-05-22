import { EC2 } from "@aws-sdk/client-ec2";

export class AwsKeyPairValidator {
    static async validateKeyPairName( keyPairName, region ) {
        const ec2_client = new AWS.EC2({ region });
        const result = await ec2_client.describeKeyPairs({ KeyNames: [keyPairName] }).promise();
        if (result.KeyPairs.length === 0) {
            throw decoratedError(`No AWS Key Pair found by provided name: "${keyPairName}", in region: "${region}"`);
        }
    }
}
