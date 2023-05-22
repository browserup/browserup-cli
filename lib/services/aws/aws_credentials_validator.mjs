import { EC2 } from "@aws-sdk/client-ec2";
import { STS } from "@aws-sdk/client-sts";

export class AwsCredentialsValidator {
    static async validateCredentials() {
        log.debug("Validating AWS credentials...");

        const ec2 = new EC2();
        const sts = new STS();

        sts.getCallerIdentity()
            .then((data) => {
                log.info("AWS credentials validated");
            }).catch((err) => {
            if (err.code === "InvalidClientTokenId") {
                throw decoratedError("AWS credentials are invalid. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env variables");
            } else {
                throw err;
            }
        });
    }

}

// Usage:
// import AwsCredentialsValidator from "./AwsCredentialsValidator.js";
//
// async function main() {
//     try {
//         await AwsCredentialsValidator.validateCredentials();
//         log.info("AWS credentials are valid");
//     } catch (e) {
//         log.error(e.message);
//     }
// }
