export class AwsKeyPairValidator {
    static async validate_key_pair_name({ key_pair_name, region }) {
        const ec2_client = new AWS.EC2({ region });
        const result = await ec2_client.describeKeyPairs({ KeyNames: [key_pair_name] }).promise();
        if (result.KeyPairs.length === 0) {
            throw new Error(`No AWS Key Pair found by provided name: '${key_pair_name}', in region: '${region}'`);
        }
    }
}
