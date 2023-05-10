import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { validate } from 'jsonschema';
import { BrowserUpYamlMissing, InvalidConfigException } from "../exceptions.mjs";

export class ConfigRepository {
    constructor(config) {
        this.configPath = path.resolve(config);

        if (!fs.existsSync(this.configPath)) {
            throw new BrowserUpYamlMissing(`Browserup YAML does not exist: ${this.configPath}`);
        }
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        this.config = yaml.parse(fileContent);

        const schemapath = path.resolve("./lib/schemas/schema.json");
        const schema = JSON.parse(fs.readFileSync(schemapath, 'utf-8'));

        let result = validate(this.config, schema);
        if (!result.valid) {
            throw new InvalidConfigException(result.errors);
        }
    }

    verifyYamlExists() {
        if (!fs.existsSync(this.configPath)) {
            throw new BrowserUpYamlMissing(`Browserup YAML does not exist: ${this.configPath}`);
        }
    }
}
