import tar from "tar";
import fs from "fs";
import path from "path";
import os from "os";

export class TarFileGenerator {
    static async packTarTgz(sourceFolderPath) {
        const destDirPath = fs.mkdtempSync(path.join(os.tmpdir(), 'browserup-'));
        const destDirName = path.basename(sourceFolderPath);
        const destFilePath = `${destDirPath}/${destDirName}.tar.gz`;

        const items = fs.readdirSync(sourceFolderPath)
        log.debug(`Preparing tar gz for ${items.length} files from ${sourceFolderPath} to: ${destFilePath}`)
        await tar.c(
            {
                gzip: true,
                file: destFilePath,
                cwd: sourceFolderPath
            },
            items
        )
        return destFilePath
    }
}
