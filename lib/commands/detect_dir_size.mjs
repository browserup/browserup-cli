import fs from 'fs';
import path from 'path';

export function getDirectorySize(dir) {
    let size = 0;
    return traverse(dir);

    function traverse(dirPath) {

      const files = fs.readdirSync(dirPath);
  

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          size += stats.size;
        } 

        else if (stats.isDirectory()) {
          traverse(filePath);
        }

      }
      return size
    }
}
