import yaml from "js-yaml";
import fs from "fs";

export function readYaml(path) {
    return yaml.load(fs.readFileSync(path, "utf8")) || {};
}