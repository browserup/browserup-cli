
import * as fs from "fs";
import * as path from "path"
import * as yaml from "yaml";
import { validate } from "jsonschema";
import { ErrorType, decoratedError } from "../browserup_errors.mjs";
import {ClusterType} from "./cluster_type.mjs";
import {fileExists} from "../utils/file_utils.mjs";
import {convertKeysToCamelCase} from "../utils/dto_format_utils.mjs";
import {getAbsolutePathFromRelativeToRoot} from "../utils/path_utils.mjs";

const DEFAULT_CLUSTER_TYPE = ClusterType.LOCAL;
const DEFAULT_THINK_TIME = "30s";
const DEFAULT_VUS_PER_VCPU = 2;
const DEFAULT_ITERATION_DELAY = "5s";
const DEFAULT_RESET_SESSION_AFTER_ITERATION = false;
const DEFAULT_PROXY_CONFIG = {
    "filter_images": true,
    "filter_common_third_party_js": true,
    "filter_multimedia": true,
    "use_custom_config": false,
    "custom_config_path": ""
};


export class Config {
    constructor(configPath) {
        this.errors = [];
        this.configPath = path.resolve(configPath);

        log.debug(`Loading config from ${configPath}`);

        // check if file exists and is readable
        if(!fileExists(this.configPath)) {
            throw decoratedError({msg: `Config missing at ${this.configPath}`, type: ErrorType.INVALID_CONFIG});
        }

        const model = this.parseModel(configPath);
        this.assignDefaults(model);

        if (errors.length > 0) {
            throw decoratedError({msg: `Invalid config at ${this.configPath}, errors: ${errors.join(',')}`})
        }

        this.model = convertKeysToCamelCase(model)
        log.debug(`Loaded config: ${JSON.stringify(this)}`);
    }

    assignDefaults(model) {
        const scn = model.scenario;
        this.assignDefaultAllocationPercents(scn.profiles);
        this.assignAllocationActuals(scn.profiles, scn.total_users);
        scn.root_dir = path.dirname(this.configPath);
        scn.profiles.forEach((prof) => {
            prof.vus_per_vcpu = prof.vus_per_vcpu || DEFAULT_VUS_PER_VCPU;
            prof.think_time = prof.think_time || DEFAULT_THINK_TIME;
            prof.iteration_delay = prof.iteration_delay || DEFAULT_ITERATION_DELAY;
            prof.reset_session_after_iteration = prof.reset_session_after_iteration || DEFAULT_RESET_SESSION_AFTER_ITERATION;
            prof.proxy_config = Object.assign({}, DEFAULT_PROXY_CONFIG, prof.proxy_config || {});
        });
        Config.validateScenarioProfiles(scn.profiles, this.errors);
        this.assignDefaultClusterType(model);
    }

    parseModel(configPath) {
        let model = yaml.parse(fs.readFileSync(this.configPath, "utf8"));
        try {
            const schemaPath = getAbsolutePathFromRelativeToRoot("lib/schemas/schema.json");
            const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

            let result = validate(model, schema);
            if (!result.valid) {
                throw decoratedError({msg: `Config missing at ${this.configPath}`, type: ErrorType.INVALID_CONFIG});
            }
        } catch (e) {
            if (e.code !== undefined && (e.code === "ENOENT")) {
                this.errors.push(`Config missing at ${configPath}`);
            }
            throw decoratedError({error: e, msg: 'Invalid Config', type: ErrorType.INVALID_CONFIG});
        }
        model.images?.forEach((img) => Config.validateImageName(img.name, this.errors));
        model.reports?.forEach((report) => Config.validFileSafeName(report.name));
        return model;
    }

    static validateProfileImage(images, profile, errors) {
        const linkedImage = images.map((i) => i.id).find((i) => i === profile.image);
        if (!linkedImage) {
            errors.push(`Invalid image provided for profile: not found image by name: "${profile.image}"`);
        }
    }

    static validateScenarioProfiles(scenarioProfiles, errors) {
        const nonUniqueProfiles = scenarioProfiles.reduce((acc, cur) => {
            acc[cur.name] = (acc[cur.name] || 0) + 1;
            return acc;
        }, {});

        const duplicateProfiles = Object.keys(nonUniqueProfiles).filter((name) => nonUniqueProfiles[name] > 1);

        if (duplicateProfiles.length > 0) {
            errors.push(`Scenario profiles must have unique names, found duplicates: ${duplicateProfiles.join(", ")}`);
        }

        scenarioProfiles.forEach((prof) => {
            if (!prof.artifact_dir && !prof.image) {
                errors.push(`Invalid profile ${prof.name || ""} - profile must contain an artifact_dir or image.`);
            }
        });
    }

    static validFileSafeName(name) {
        return /^[a-z0-9.\-_]+$/.test(name) && !(/[.\-_]{2,}|^[-_.]|[-_.]$/).test(name);
    }

    validateReportName(name) {
        if (!Config.validFileSafeName(name)) {
            this.errors.push(`Invalid report name "${name}". Report name must contain lowercase letters and/or digits, may contain non-consecutive underscores, periods, and dashes, and may not begin or end with underscores, periods, or dashes.`);
        }
    }

    static validateImageName(name, errors = []) {
        if (!Config.validFileSafeName(name)) {
            errors.push(`Invalid image name "#{name}". Image name must contain lowercase letters and/or digits, may contain non-consecutive underscores, periods, and/or dashes, and must start and end with a lowercase letter or digit.`);
        }
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    clusterType() {
        return this.model.browserup.clusterType;
    }

    localCluster() {
        return this.clusterType() === ClusterType.LOCAL;
    }

    remoteCluster() {
        return this.clusterType() === ClusterType.AWS;
    }

    scenario() {
        return this.model.scenario;
    }

    reports() {
        return this.model.reports;
    }

    profiles() {
        return Object.values(this.scenario().profiles);
    }

    getImage(imageName) {
        if (!this.model.images) return null;
        return this.model.images.find((s) => s.name === imageName);
    }

    imagesForScenario(scenarioId) {
        return this.scenario().profiles.map((profile) => this.getImage(profile.image));
    }

    allocationPercentAsNumber(profile) {
        return profile.allocation ? parseInt(profile.allocation.slice(0, -1), 10) : null;
    }

    assignAllocationActuals(profiles, totalUsers) {
        profiles.forEach((prof) => {
            prof.allocation_actual = Math.round((this.allocationPercentAsNumber(prof) / 100) * totalUsers);
        });
    }

    assignDefaultClusterType(model) {
        model.browserup = model.browserup || {};
        model.browserup.clusterType = model.browserup.clusterType || DEFAULT_CLUSTER_TYPE;
    }

    assignDefaultAllocationPercents(profiles) {
        let allocatedProfiles = 0;
        let unallocatedPercent = 100;
        profiles.forEach((prof) => {
            const allocationPercent = this.allocationPercentAsNumber(prof);
            if (allocationPercent !== null) {
                allocatedProfiles += 1;
                unallocatedPercent -= allocationPercent;
            }
        });

        const unallocatedProfiles = profiles.length - allocatedProfiles;

        if (unallocatedProfiles > 0) {
            const perProfileUnallocatedPercent = unallocatedPercent / unallocatedProfiles;
            let remainder = 100 % perProfileUnallocatedPercent;

            profiles.forEach((prof) => {
                if (this.allocationPercentAsNumber(prof) === null) {
                    prof.allocation = `${perProfileUnallocatedPercent + remainder}%`;
                    remainder = 0;
                }
            });
        }
    }
}
