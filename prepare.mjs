import { existsSync, readdirSync, lstatSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';

const deleteFolderRecursive = (directoryPath) => {
    if (existsSync(directoryPath)) {
        readdirSync(directoryPath).forEach((file) => {
            const curPath = join(directoryPath, file);
            if (lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                unlinkSync(curPath);
            }
        });
        rmdirSync(directoryPath);
    }
};

const directoriesToDelete = [
    'scaffolds/csharp/bin',
    'scaffolds/csharp/obj',
    'scaffolds/seleniumCsharp/bin',
    'scaffolds/seleniumCsharp/obj',
    'scaffolds/playwrightCsharp/bin',
    'scaffolds/playwrightCsharp/obj',
    'scaffolds/seleniumJava/target',
    'scaffolds/java/target',
];

directoriesToDelete.forEach((dir) => {
    deleteFolderRecursive(dir);
});
