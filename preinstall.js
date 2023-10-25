import path from 'path';

function isInstalledGlobally() {
    // The global installation path will include the package name, but not node_modules.
    // The local installation path will include node_modules.
    // The dev development path will not include node_modules.
    const globalPath = path.join(path.dirname(import.meta.url), '..');
    return !globalPath.includes('node_modules');
}

if (!isInstalledGlobally()) {
    console.warn("\x1b[31m\-> Error! browserup should be installed globally to prevent browserup's node_modules from polluting your tests. Instead use: " +  "\x1b[37m" + "npm install -g browserup");
    console.warn('\x1b[31m\It is possible, but discouraged, to avert this check by installing with --ignore-scripts if you have a non-standard use case.\x1b[37m\n');
    process.exit(1);
}
