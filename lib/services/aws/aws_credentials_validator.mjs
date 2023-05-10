import 'aws-sdk';
export class AwsCredentialsValidator {
    static async validateCredentials() {
        log.debug('Validating AWS credentials...');

        AWS.config.update({
            region: 'your-region'
        });

        const ec2 = new AWS.EC2();
        const sts = new AWS.STS();

        try {
            await sts.getCallerIdentity().promise();
        } catch (error) {
            if (error.code === 'InvalidClientTokenId') {
                throw new Error('AWS credentials are invalid. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env variables');
            } else {
                throw error;
            }
        }
    }
}


// Usage:
// import AwsCredentialsValidator from './AwsCredentialsValidator.js';
//
// async function main() {
//     try {
//         await AwsCredentialsValidator.validateCredentials();
//         log.info('AWS credentials are valid');
//     } catch (error) {
//         log.error(error.message);
//     }
// }
