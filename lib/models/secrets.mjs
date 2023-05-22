import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { truncate } from 'fs/promises';

export class Secrets {
    constructor(secretsYamlPath) {
        this.secrets = {};
        this.secretsYamlPath = secretsYamlPath;
        log.debug(`Loading secrets from ${path.resolve(secretsYamlPath)}`);

        if (!fs.existsSync(secretsYamlPath)) {
            log.debug("No secrets file found");
            return;
        }

        this.secrets = yaml.load(fs.readFileSync(secretsYamlPath, "utf8")) || {};
    }

    secret(secretName) {
        return this.secrets[secretName];
    }

    async saveSecret(secretName, secretValue) {
        this.secrets[secretName] = secretValue;
        const dirname = path.dirname(this.secretsYamlPath);

        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
        }

        await fs.promises.writeFile(this.secretsYamlPath, yaml.dump(this.secrets), "utf8");
    }

    async clearSecrets() {
        const dirname = path.dirname(this.secretsYamlPath);

        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
        }
        fs.truncate(this.secretsYamlPath, 0, function(err) {
            if (err) {
                log.debug('Error truncating file:', err);
            } else {
                log.debug('File truncated successfully');
            }
        });

        this.secrets = {};
    }
}

export default Secrets;
