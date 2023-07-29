import crypto from "crypto";
import {Secrets} from "../models/secrets.mjs"
import {BrowserUpPaths} from "./browserup_paths.mjs";

export class LocalEnvVars {
    static APP_NAME = "browserup";

    static testEnv() {
        return {
            "BROWSERUP_MYSQL_PASSWORD": "just_testing",
            "BROWSERUP_INFLUX_DB_PASSWORD": this.getOrCreateSecret("BROWSERUP_INFLUX_DB_PASSWORD"),
            "BROWSERUP_RABBITMQ_DEFAULT_PASS": "just_testing",
            "BROWSERUP_API_URL": "http://localhost:3000"
        };
    }

    static clearSecrets() {
        this.initSecrets();
        this.secrets.clearSecrets();
    }

    static setSecrets(secretNameValues = {}) {
        this.initSecrets();
        for (const [name, value] of Object.entries(secretNameValues)) {
            this.setSecret(name, value);
        }
    }

    static setSecret(secretName, secretValue) {
        this.initSecrets();
        this.secrets.saveSecret(secretName, secretValue);
    }

    static getSecret(secretName) {
        this.initSecrets();
        return this.secrets.secret(secretName);
    }

    static getEnvOrSecret(envName, secretName) {
        return process.env[envName] || this.getSecret(secretName);
    }

    static getOrCreateSecret(secretName) {
        this.initSecrets();
        let secretValue = this.secrets.secret(secretName);
        if (secretValue) {
            return secretValue;
        }
        secretValue = crypto.randomBytes(15).toString("base64");
        this.secrets.saveSecret(secretName, secretValue);
        return secretValue;
    }

    static initSecrets() {
        if (!this.secrets) {
            const secretsPath = BrowserUpPaths.appSettingsPath() + "/secrets.yaml";
            this.secrets = new Secrets(secretsPath);
        }
    }

}
