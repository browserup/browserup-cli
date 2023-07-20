import * as fs from 'fs';
import { decoratedError } from "../browserup_errors.mjs";
import { parse } from 'csv-parse';

export class DataBanksLoader {
    static async load(filename, path, csvOptions = {}, validationOptions = {} ) {
        if (!filename || !path) {
            throw decoratedError("Expected both file name and path to be provided, cannot load databank");
        }
        return this.loadFile(
            new URL(`${path}/${filename}`, import.meta.url),
            csvOptions,
            validationOptions,
        );
    }

    static async loadFile(file, csvOptions = {}, validationOptions = {} ) {
        if (!file) {
            throw decoratedError("Databank file path is empty");
        }
        if (!fs.existsSync(file)) {
            throw decoratedError("Databank file doesn't exist");
        }
        const databankStr = fs.readFileSync(file, "utf-8");
        const records = [];
        const parser = fs
            .createReadStream(file)
            .pipe(parse({}));
        for await (const record of parser) {
            records.push(record);
        }
        return {
            originalString: databankStr,
            records: records
        }
    }
}


