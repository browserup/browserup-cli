import crypto from "crypto";
import fs from "fs";
import yaml from "yaml";
import {Secrets} from "../models/secrets.mjs"
import { ClusterType } from "../models/cluster_type.mjs";
import * as os from "os";

export class LocalEnvVars {
    static APP_NAME = "browserup";

    static testEnv() {
        return {
            "MYSQL_PASSWORD": "just_testing",
            "INFLUX_DB_PASSWORD": this.getOrCreateSecret("INFLUX_DB_PASSWORD"),
            "RABBITMQ_DEFAULT_PASS": "just_testing",
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
            const secretsPath = `${this.appSettingsPath(this.APP_NAME)}/secrets.yaml`;
            this.secrets = new Secrets(secretsPath);
        }
    }

    static appSettingsPath(appName) {
        const homeDir = os.homedir();
        return `${homeDir}/.browserup/${appName}`;
    }
}
