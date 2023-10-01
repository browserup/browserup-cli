import fs from 'fs';
import path from 'path';

export function getDirectorySize(dir) {
    let size = 0;
    return traverse(dir);
    // Helper function to traverse the directory and its subdirectories
    function traverse(dirPath) {
      // Read the contents of the directory
      const files = fs.readdirSync(dirPath);
  
      // Loop through each file and subdirectory
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
  
        // If it's a file, add its size to the total
        if (stats.isFile()) {
          size += stats.size;
        } 
        // If it's a subdirectory, recursively traverse it
        else if (stats.isDirectory()) {
          traverse(filePath);
        }
        if (size>200 *124 *124){
            
            return true        
        }
      }return false
    }
}