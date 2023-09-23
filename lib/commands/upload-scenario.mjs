import {readFileIntoString} from "../utils/file_utils.mjs";
import {decoratedError, ErrorType} from "../browserup_errors.mjs";
import fs, {existsSync} from "fs";
import {WebConsoleClient} from "../services/webconsole_client.mjs";
import {camelCaseToUnderscore} from "../utils/dto_format_utils.mjs";
import path from "path";
import * as yaml from "yaml";

export async function uploadScenario(scenario, apiToken, config) {
    try {
        log.info(`Running Create/update scenario: "${scenario.name}"`);
        const response = await WebConsoleClient.sendPostRequest({
            path: `load/cli_scenarios/create_or_update`,
            data: await prepareScenarioPayload(scenario, config),
            qParams: {api_token: apiToken}
        })
        log.debug("Upload Scenario completed successfully");
        return response.data;
    } catch (e) {
        await log.debug(`Error uploading scenario: ${e.message}`);
        throw decoratedError({msg: "Failed to upload scenario", error: e, errorType: "UploadScenarioError"});
    }
}

export async function prepareProfilesPayload(scenario, config) {
    log.debug("Preparing profiles payloads");
    const profilesPayload = {};
    scenario.profiles.forEach((profile, profileIndex) => {
        profilesPayload[profileIndex] = prepareProfilePayload(profile, config);
    });
    return profilesPayload;
}

export function prepareProfilePayload(profile, config) {
    log.debug("Preparing profiles payload");
    const databank = profile.databank;
    const databankPayload = databank ? prepareDatabankPayload(databank) : undefined;

    const imageOptions = getImage(profile, config);
    const iterationDelayDuration = parseInt(profile.iterationDelay.slice(0, -1)) || 10;
    const thinkTime = parseInt(profile.thinkTime.slice(0, -1)) || 30;

    const profilePayload = {
        name: profile.name,
        percent: parseInt(profile.allocation.slice(0, -1)),
        iteration_delay_duration: iterationDelayDuration,
        reset_session_after_iteration: profile.resetSessionAfterIteration,
        command: profile.command,
        think_duration: thinkTime,
        proxy_config: prepareProxyCfgPayload(config, profile.proxyConfig),
        image: imageOptions,
        databank: databankPayload,
        vus_per_vcpu: profile.vusPerVcpu,
    };

    if (profile.region) {
        profilePayload.region = profile.region;
    }

    if (profile.artifactSha) {
        profilePayload.artifact_sha = profile.artifactSha;
    }

    return profilePayload;
}

export function prepareImagePayload(imageOptions) {
    log.debug("Preparing image payload");
    const payload = {name: imageOptions.name};
    if (imageOptions.registry) {
        payload.registry_name = imageOptions.registry;
    }
    if (imageOptions.tag) {
        payload.tag = imageOptions.tag;
    }
    return payload;
}

function prepareDatabankPayload(databank) {
    log.debug("Preparing databank payload");
    const databankPath = databank.path;
    const databankFilename = databank.name;

    let databankStr = ""; // Load the databank data using databankFilename, databankPath, and other options
    readFileIntoString(databankPath)
        .then(data => databankStr = data)
        .catch(e => console.error(e));
    return databankStr;
}

function prepareStagesPayload(scenario) {
    try {
        log.debug('prepareStagesPayload');
        let stages = [];
        let rampDuration = 0;

        scenario.ramp.forEach((ramp, index) => {
            const rampToPercent = parseFloat(ramp.rampTo.slice(0, -1)) / 100;
            const duration = parseInt(ramp.over.slice(0, -1));
            rampDuration += duration;

            const stage = {
                position: index,
                duration: duration,
                stage_type: "ramp_to",
                throttle_type: "even",
                target_users_count: Math.round(scenario.totalUsers * rampToPercent),
            };
            stages.push(stage);
        });

        const totalTime = parseInt(scenario.stopAfter.slice(0, -1));

        if (totalTime - rampDuration > 0) {
            stages.push({
                position: scenario.ramp.length,
                duration: totalTime - rampDuration,
                stage_type: "constant",
                throttle_type: "immediate",
                target_users_count: scenario.totalUsers,
            });
        }
        return stages;
    } catch (e) {
        throw decoratedError({error: e, msg: 'Error preparing Stages Payload', type: ErrorType.SCENARIO_PAYLOAD});
    }
}

async function prepareScenarioPayload(scenario, config) {
    try {
        return {
            scenario: {
                name: scenario.name,
                total_time_minutes: parseInt(scenario.stopAfter.slice(0, -1)),
                profiles: await prepareProfilesPayload(scenario, config),
                stages: prepareStagesPayload(scenario),
            },
        };
    } catch (e) {
        log.debug('In first catch');
        throw decoratedError({error: e, msg: 'Error preparing Scenario Payload', type: ErrorType.SCENARIO_PAYLOAD});
    }
}

export function getImage(profile, config) {
    return config.getImage(profile.image);
}

export function prepareProxyCfgPayload(config, proxyConfig) {
    if (!proxyConfig) {
        return null;
    }

    const result = {...proxyConfig};
    delete result.customConfigPath;

    if (proxyConfig.useCustomConfig !== true) {
        return camelCaseToUnderscore(result);
    }

    const customConfigPath = path.join(path.dirname(config.configPath), proxyConfig.customConfigPath);
    if (!existsSync(customConfigPath)) {
        throw decoratedError(
            `"use_custom_config" specified for profile, but couldn't find config file by path: "${customConfigPath}"`
        );
    }
    const customConfigContent = fs.readFileSync(customConfigPath, "utf-8");
    try {
        yaml.parse(customConfigContent);
    } catch (e) {
        throw decoratedError(
            {msg: `Provided proxy config yaml (by path: ${customConfigPath}) is not a valid YAML file`, error: e}
        )
    }
    result.customConfig = customConfigContent;
    return camelCaseToUnderscore(result);
}


