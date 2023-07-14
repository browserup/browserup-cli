import {fileURLToPath} from "url";
import path from "path";

export function getAbsoluteRootPath() {
    const utilsPath = fileURLToPath(import.meta.url);
    return utilsPath.replace(/lib(\/|\\)utils(\/|\\)path_utils\.mjs/, '')
}

export function getAbsolutePathFromRelativeToRoot(...relativePathComponents) {
    return path.join(getAbsoluteRootPath(), ...relativePathComponents)
}

