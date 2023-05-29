import * as fs from 'fs';
import { decoratedError } from "../browserup_errors.mjs";
import { parse } from 'csv-parse';

export class DataBanksLoader {
    static load(filename, path, csvOptions = {}, validationOptions = {} ) {
        if (!filename || !path) {
            throw decoratedError("Expected both file name and path to be provided, cannot load databank");
        }
        return this.loadFile(
            new URL(`${path}/${filename}`, import.meta.url),
            csvOptions,
            validationOptions,
        );
    }

    static loadFile(file, csvOptions = {}, validationOptions = {} ) {
        if (!file) {
            throw decoratedError("Databank file path is empty");
        }
        if (!fs.existsSync(file)) {
            throw decoratedError("Databank file doesn't exist");
        }
        const databankStr = fs.readFileSync(file, "utf-8");
        let databank;
        try {
            databank = parse(databankStr, csvOptions);
        } catch (e) {
            throw decoratedError(`Invalid databank format: ${e.message}`);
        }
        if (validationOptions.entriesRequired && databank.length < 1) {
            throw decoratedError("Expected at least one row with values");
        }
        return [databank, databankStr];
    }
}


