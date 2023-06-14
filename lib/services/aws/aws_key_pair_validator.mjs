import { decoratedError } from "../../browserup_errors.mjs";
import {AwsEc2Client} from "./aws_ec2_client.mjs";

export class AwsKeyPairValidator {
    static async validateKeyPairName( keyPairName, region ) {
        const result = await AwsEc2Client.findKeyPairs([keyPairName], region);
        if (result.length === 0) {
            throw decoratedError(`No AWS Key Pair found by provided name: "${keyPairName}", in region: "${region}"`);
        }
    }
}
