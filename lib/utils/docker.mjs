import { exec } from "child_process";
import fs from "fs-extra";
import {DcConfigEditor} from "../services/dc_config_editor.mjs";
import * as path from "path";
import {BrowserUpPaths} from "./browserup_paths.mjs";
import { SERVICES_VERSION } from "../browserup_cli.mjs";
import { decoratedError } from "../browserup_errors.mjs";
import {getAbsolutePathFromRelativeToRoot} from "./path_utils.mjs";

export class Docker {
  static tagForScript(scriptId) {
    return `browserup/${scriptId}:latest`;
  }

  static async tag(theirImage, newTag) {
    log.debug(`Tagging image ${theirImage} as ${newTag}`);
    const cmd = `docker tag "${theirImage}" "${newTag}"`;
    const { _exitCode, errors } = await Docker.execDockerCmd(cmd);
    if (errors.length > 0) {
      throw decoratedError(`Failed to tag "${theirImage}" as "${newTag}". Caused by: \n>> ${errors.join(">> ")}`);
    }
  }

  static async build(dockerfile, tag, opts) {
    const cmd = `docker build -f "${dockerfile.realpath}" -t "${tag}" "${dockerfile.dirname.realpath}"`;
    const finalCmd = opts.no_cache ? cmd + " --no-cache" : cmd;
    const { _exitCode, errors } = await Docker.execDockerCmd(finalCmd);
    if (errors.length) {
      throw decoratedError(`Failed to build "${dockerfile}". Caused by: \n>> ${errors.join(">> ")}`);
    }
  }

  static async login(username, password, server) {
    const cmd = `docker login -u ${username} -p ${password} ${server}`;
    const redactedCmd = `docker login -u ${username} -p REDACTED ${server}`;
    const { _exitCode, errors } = await Docker.execDockerCmd(cmd, redactedCmd);
    if (_exitCode > 0) {
      throw decoratedError(`Failed to login to registry. Caused by: \n>> ${errors.join(">> ")}`);
    }
  }

  static async push(tag) {
    log.info(`Pushing script image ${tag} to container registry...`);
    const cmd = `docker push "${tag}"`;
    const { _exitCode, errors } = await Docker.execDockerCmd(cmd);
    if (errors.length) {
      throw decoratedError(`Failed to push "${tag}". Caused by: \n>> ${errors.join(">> ")}`);
    }
  }

  static async pull(tag) {
    const cmd = `docker pull "${tag}"`;
    const { _exitCode, errors } = await Docker.execDockerCmd(cmd);
    if (errors.length) {
      throw decoratedError(`Failed to pull "${tag}". Caused by: \n>> ${errors.join(">> ")}`);
    }
  }

  static execDockerCmd(cmd, _redactedCmd = null) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          if (error.code === "ENOENT") {
            reject(new Error("Docker not found on the path."));
          } else {
            const errors = stderr.trim().split("\n");
            resolve({ exitCode: error.code, errors });
          }
        } else {
          resolve({ exitCode: 0, errors: [] });
        }
      });
    });
  }
}

export function copyFilesToDotFolderIfMissing(servicesImageTag) {
  const externalUserSettingsFolder = BrowserUpPaths.appSettingsPath("browserup");
  const internalDcYamlPath = getAbsolutePathFromRelativeToRoot("lib/docker_compose/docker-compose.yml")
  const internalResourcesPath = getAbsolutePathFromRelativeToRoot("lib/docker_compose/resources")
  const dcYmlPath = BrowserUpPaths.dockerComposeYmlPath();

  if (!fs.pathExistsSync(externalUserSettingsFolder)) {
    fs.mkdirpSync(externalUserSettingsFolder);
  }

  log.debug(`Copying files from ${internalResourcesPath} to ${externalUserSettingsFolder}/resources`);

  fs.copySync(internalResourcesPath, `${externalUserSettingsFolder}/resources`, { removeDestination: true });

  fs.copyFileSync(internalDcYamlPath, BrowserUpPaths.dockerComposeYmlPath());

  servicesImageTag = servicesImageTag || SERVICES_VERSION;

  DcConfigEditor.updateServicesImageTags(dcYmlPath, ["grid-java-api", "grid-java-coordinator", "webconsole", "grid-java-observer"], servicesImageTag);

  DcConfigEditor.updateEnvForService(
    dcYmlPath,
    "grid-java-coordinator",
    "MINION_IMAGE_VERSION_TAG",
    servicesImageTag
  );
}

