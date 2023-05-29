import * as fs from 'fs';
import path from "path";
import os from "os";
import { decoratedError } from "../browserup_errors.mjs";

export class BrowserUpPaths {
    static dockerComposeYmlPath() {
        const settingsFolder = this.appSettingsPath("browserup");
        const filePath = path.join(settingsFolder, "docker-compose.yml");
        return filePath;
    }

    static appSettingsPath(appName = 'browserup') {
        if (os.platform() === "win32") {
            return `${process.env.APPDATA}/${appName}`;
        }
        return `${process.env.HOME}/.${appName}`;
    }

    static globsToPathnames(globs, rootDir) {
        return globs.flatMap((glob) => {
            const fullPath = path.join(rootDir, glob);
            return fs.readdirSync(fullPath);
        });
    }

    static segments(filePath) {
        return path.dirname(filePath).split(path.sep);
    }

    static findCommonRoot(pathnames) {
        let commonSegments = this.segments(pathnames[0]);

        for (const nextPath of pathnames.slice(1)) {
            const nextSegments = this.segments(nextPath);
            commonSegments = commonSegments.slice(0, nextSegments.findIndex((s, i) => s !== commonSegments[i]));
        }

        return path.join(path.sep, ...commonSegments);
    }

    static reparentPaths(pathnames, newParentDir) {
        const newPaths = [];
        const commonAncestor = this.findCommonRoot(pathnames);

        for (const filePath of pathnames) {
            newPaths.push(path.join(newParentDir, filePath.slice(commonAncestor.length)));
        }

        return newPaths;
    }

    static copyFiles(sourcePaths, destPaths) {
        if (sourcePaths.length !== destPaths.length) {
            throw decoratedError("Mismatched source and destination paths");
        }

        for (const [sourcePath, destPath] of sourcePaths.entries()) {
            const destDir = path.dirname(destPath);
            fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(sourcePath, destPaths[destPath]);
        }
    }
}
