import crypto from "crypto";
import fs from "fs";

export async function calculateSHA256Hash(filePath) {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filePath);

    for await (const chunk of input) {
        hash.update(chunk);
    }

    return hash.digest('hex');
}
