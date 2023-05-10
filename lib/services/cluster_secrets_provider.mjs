import fs from 'fs';
import crypto from 'crypto';

export class ClusterSecretsProvider {
    static create() {
        const configPath = new URL('../config/env.properties', import.meta.url);
        const basePropertiesStr = fs.readFileSync(configPath, 'utf-8');
        const baseProperties = basePropertiesStr
            .split('\n')
            .filter(line => line)
            .reduce((obj, line) => {
                const [key, value] = line.split('=');
                obj[key] = value;
                return obj;
            }, {});

        const properties = { ...baseProperties };
        properties['S3_MINIO_SECRET_ACCESS_KEY'] = ClusterSecretsProvider.friendlyToken();
        return properties;
    }

    static get() {
        if (!this.secrets) {
            this.secrets = this.create();
        }
        return this.secrets;
    }

    static friendlyToken() {
        return crypto.randomBytes(32).toString('hex');
    }
}
