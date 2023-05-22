import fs from "fs";
import yaml from "js-yaml";

export class DcConfigEditor {
    static updateServicesImageTags( dcYmlPath, serviceNames, newImageTag ) {
        newImageTag = newImageTag.replace("/", "-");
        const dockerComposeContent = yaml.load(fs.readFileSync(dcYmlPath, "utf8"));

        const services = dockerComposeContent["services"];
        serviceNames
            .map(serviceName => services[serviceName])
            .filter(service => service !== undefined)
            .forEach(service => {
                service["image"] = DcConfigEditor.updateImageTag(service["image"], newImageTag);
            });

        fs.writeFileSync(dcYmlPath, yaml.dump(dockerComposeContent));
    }

    static updateEnvForService( dcYmlPath, serviceName, envKey, envNewValue ) {
        const dockerComposeContent = yaml.load(fs.readFileSync(dcYmlPath, "utf8"));

        const services = dockerComposeContent["services"];
        if (!services[serviceName]) return;

        const environment = services[serviceName]["environment"];
        if (!environment) return;

        const indexToReplace = environment.findIndex(env => env.includes(envKey));
        if (indexToReplace === -1) return;

        environment[indexToReplace] = `${envKey}=${envNewValue}`;

        fs.writeFileSync(dcYmlPath, yaml.dump(dockerComposeContent));
    }

    static updateImageTag(image, newImageTag) {
        const imageWithoutTag = image.slice(0, image.lastIndexOf(":"));
        return `${imageWithoutTag}:${newImageTag}`;
    }
}
