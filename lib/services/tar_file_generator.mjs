import tar from 'tar';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export class TarFileGenerator {
    static async packTarTgz(sourceFolderPath, destFilePath) {
        const cwd = process.cwd();
        process.chdir(sourceFolderPath);

        const gzip = zlib.createGzip();
        const writeStream = fs.createWriteStream(destFilePath);

        await tar.c(
            {
                gzip: true,
                cwd: '.',
                sync: true,
                file: destFilePath,
            },
            ['.']
        );

        process.chdir(cwd);
    }

    static async unpackTarTgz(sourceTarGz, destFolder) {
        await tar.x({
            file: sourceTarGz,
            cwd: destFolder,
            sync: true,
        });
    }
}

export default TarFileGenerator;
