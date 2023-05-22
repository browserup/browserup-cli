import axios from "axios";
import fs from "fs/promises";
import {BrowserUpUrl} from "../utils/browserup_url.mjs";
import {readFileIntoString} from "../utils/file_utils.mjs";
import { BrowserUpError, ErrorType, decoratedError, ExitProcessError } from "../browserup_errors.mjs";
import {Config} from "../models/config.mjs";

export async function uploadScenario(scenario, apiToken, config) {
    try {
        log.info(`Running Create/update scenario: "${scenario.name}"`);
        const url = `${BrowserUpUrl.browserupLoadUrl()}/cli_scenarios/create_or_update`;
        const payload = prepareScenarioPayload(scenario, config);
        const response = await axios.post(url, payload, {
            params: {api_token: apiToken},
            headers: {Accept: "application/json"},
        });
        scenario = response.data;
        log.debug(`RESPONSE (Remote scenario): ${JSON.stringify(scenario, null, 2)}`);
        return scenario;
    } catch (e) {
        await log.debug(`Error uploading scenario: ${e.message}`);
        throw decoratedError({msg: "Failed to upload scenario", error: e, errorType: "UploadScenarioError"});
    }
    log.debug("Upload Scenario completed successfully");
}

export async function prepareProfilesPayload(scenario, config) {
    log.debug("Preparing profiles payloads");
    const profilesPayload = {};
    scenario.profiles.forEach((profile, profileIndex) => {
        profilesPayload[profileIndex] = prepareProfilePayload(profile, config);
    });
    return profilesPayload;
}

export async function prepareProfilePayload(profile, config){
    log.debug("Preparing profiles payload");
    const databank = profile.databank;
    const databankPayload = databank ? prepareDatabankPayload(databank) : undefined;

    const imageOptions = getImage(profile, config);
    const iterationDelayDuration = parseInt(profile.iteration_delay.slice(0, -1)) || 10;
    const thinkTime = parseInt(profile.think_time.slice(0, -1)) || 30;

    const profilePayload = {
        name: profile.name,
        percent: parseInt(profile.allocation.slice(0, -1)),
        iteration_delay_duration: iterationDelayDuration,
        reset_session_after_iteration: profile.reset_session_after_iteration,
        command: profile.command,
        think_duration: thinkTime,
        proxy_config: prepareProxyCfgPayload(profile.proxy_config),
        image: imageOptions,
        databank: databankPayload,
        vus_per_vcpu: profile.vus_per_vcpu,
    };

    if (profile.region) {
        profilePayload.region = profile.region;
    }

    if (profile.artifact_sha) {
        profilePayload.artifact_sha = profile.artifact_sha;
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
        .catch(error => console.error(error));
    return databankStr;
}



function prepareStagesPayload(scenario) {
    try {
        log.debug('prepareStagesPayload');
        var stages = [];
        let rampDuration = 0;

        scenario.ramp.forEach((ramp, index) => {
            const rampToPercent = parseFloat(ramp.ramp_to.slice(0, -1)) / 100;
            const duration = parseInt(ramp.over.slice(0, -1));
            rampDuration += duration;

            const stage = {
                position: index,
                duration: duration,
                stage_type: "ramp_to",
                throttle_type: "even",
                target_users_count: Math.round(scenario.total_users * rampToPercent),
            };
            stages.push(stage);
        });

        const totalTime = parseInt(scenario.stop_after.slice(0, -1));

        if (totalTime - rampDuration > 0) {
            stages.push({
                position: scenario.ramp.length,
                duration: totalTime - rampDuration,
                stage_type: "constant",
                throttle_type: "immediate",
                target_users_count: scenario.total_users,
            });
        }
        return stages;
    } catch (e) {
        throw decoratedError({error: e, msg: 'Error preparing Stages Payload', type: ErrorType.SCENARIO_PAYLOAD});
    }
}

function prepareScenarioPayload(scenario, config) {
    try {
        let payload = {
            scenario: {
                name: scenario.name,
                total_time_minutes: parseInt(scenario.stop_after.slice(0, -1)),
                profiles: prepareProfilesPayload(scenario, config),
                stages: prepareStagesPayload(scenario),
            },
        };
        return payload;
    }
    catch (e) {
        log.debug('In first catch');
        throw decoratedError({error: e, msg: 'Error preparing Scenario Payload', type: ErrorType.SCENARIO_PAYLOAD});
    }
}

export function getImage(profile, config) {
    return config.getImage(profile.image);
}

export function prepareProxyCfgPayload(proxyConfig) {
    if (!proxyConfig) {
        return null;
    }

    const result = {...proxyConfig};
    delete result.custom_config_path;

    if (proxyConfig.use_custom_config !== true) {
        return result;
    }

    const customConfigPath = proxyConfig.custom_config_path;

    // Replace the following line with the appropriate way to check for the file"s existence
    const fileExists = false; // Check if the file at customConfigPath exists

    if (!fileExists) {
        throw decoratedError(
            `"use_custom_config" specified for profile, but couldn"t find config file by path: "${customConfigPath}"`
        );
    }


    // Replace the following line with the appropriate way to read the file content
    const fileContent = ""; // Read the content of the file at customConfigPath

    result.custom_config = fileContent;
    return result;
}


