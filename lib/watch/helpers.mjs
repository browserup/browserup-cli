import chalk from "chalk";
import {padStr} from "../utils/string.mjs";
import {EOL as endOfLine} from "os";

export function printKeyValueArrayInBox(arr, box) {
    let statusString = endOfLine;
    for (let lineArr of arr) {
        let keystr = " " + chalk.blue(lineArr[0] + ":  ")
        let valuestr = chalk.white(lineArr[1])
        statusString += padStr("                                   ",
            keystr, false) + valuestr + endOfLine
    }
    box.setContent(statusString)
}

export function checkApiKeyOrMessage(){
    if (this.browserUpApiKey === undefined) {

        let msg = `
------------------------------------------------------------------------
Please get an API key from the app and export it as BROWSERUP_API_KEY.
------------------------------------------------------------------------`;

        process.stdout.write(msg, () => {
            // process.exit(1);
        });
    }
}

export function nextMagnitude(n) {
    return Math.pow(10, Math.ceil(Math.log(n) / Math.LN10 + 0.000000001));  // float math yuck
}
