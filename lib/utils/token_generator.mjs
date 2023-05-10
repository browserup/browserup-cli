import crypto from 'crypto';

export class TokenGenerator {
    static friendlyToken(length = API_TOKEN_SIZE) {
        // To calculate real characters, we must perform this operation.
        // See SecureRandom.urlsafe_base64
        const rlength = Math.ceil((length * 3) / 4);
        const buf = crypto.randomBytes(rlength);
        const base64Url = buf.toString('base64')
            .replace('+', '-')
            .replace('/', '_')
            .replace(/=+$/, '');

        return base64Url
            .replace(/[lIO0]/g, match => {
                switch (match) {
                    case 'l': return 's';
                    case 'I': return 'x';
                    case 'O': return 'y';
                    case '0': return 'z';
                    default: return match;
                }
            })
            .replace(/_/g, 'a');
    }
}

// Example usage
//const API_TOKEN_SIZE = 20;
// log.info(token);
