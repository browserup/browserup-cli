import fs from "fs";
import path from "path";
import { ErrorType, decoratedError } from "../browserup_errors.mjs";
import {Config} from "../models/config.mjs";

export class ConfigRepository {
    constructor(config) {
        this.configPath = path.resolve(config);
        this.verifyYamlExists();
        this.config = new Config(this.configPath);
    }

    verifyYamlExists() {
        if (!fs.existsSync(this.configPath)) {
            throw decoratedError({msg: `Browserup YAML does not exist: ${this.configPath}`, type: ErrorType.YAML_MISSING});
        }
    }
}
