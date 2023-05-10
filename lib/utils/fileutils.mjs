import fs from "fs";
import { exit } from "process";

if (fs.existsSync("db.json")) {
    log.info("File exists!");
    exit(1);
}


let info = [];
if (fs.existsSync("db.json")) {
    fs.readFile("db.json", function (err, data) {
        if (err) {
            log.info(err);
        }
        info = JSON.parse(data.toString());
        log.info(info);
    });
} else {
    log.info("No data available!");
}
