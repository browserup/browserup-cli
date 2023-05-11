import "fs";
import "csv-parse";

export class DataBanksLoader {
    static load({ filename, path, csvOptions = {}, validationOptions = {} }) {
        if (!filename || !path) {
            throw new Error("Expected both file name and path to be provided, cannot load databank");
        }
        return this.loadFile({
            file: new URL(`${path}/${filename}`, import.meta.url),
            csvOptions,
            validationOptions,
        });
    }

    static loadFile({ file, csvOptions = {}, validationOptions = {} }) {
        if (!file) {
            throw new Error("Databank file path is empty");
        }
        if (!fs.existsSync(file)) {
            throw new Error("Databank file doesn't exist");
        }
        const databankStr = fs.readFileSync(file, "utf-8");
        let databank;
        try {
            databank = parse(databankStr, csvOptions);
        } catch (e) {
            throw new Error(`Invalid databank format: ${e.message}`);
        }
        if (validationOptions.entriesRequired && databank.length < 1) {
            throw new Error("Expected at least one row with values");
        }
        return [databank, databankStr];
    }
}


