import { EC2Client } from "@aws-sdk/client-ec2";
import { decoratedError } from "../../browserup_errors.mjs";

export class AwsKeyPairValidator {
    static async validateKeyPairName( keyPairName, region ) {
        const ec2_client = new EC2Client({ region: "REGION" });
        const result = await ec2_client.describeKeyPairs({ KeyNames: [keyPairName] }).promise();
        if (result.KeyPairs.length === 0) {
            throw decoratedError(`No AWS Key Pair found by provided name: "${keyPairName}", in region: "${region}"`);
        }
    }
}
