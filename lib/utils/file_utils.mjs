import fs from "fs";

export function fileExists(path) {
    return fs.existsSync(path) && fs.statSync(path).isFile();
}

export async function readFileIntoString(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return data;
    } catch (e) {
        console.error(`Error while reading file at ${filePath}`, error);
        throw error;
    }
}

//
// if (fs.existsSync("db.json")) {
//     log.info("File exists!");
//     exit(1);
// }
//
//
// let info = [];
// if (fs.existsSync("db.json")) {
//     fs.readFile("db.json", function (err, data) {
//         if (err) {
//             log.info(err);
//         }
//         info = JSON.parse(data.toString());
//         log.info(info);
//     });
// } else {
//     log.info("No data available!");
// }
