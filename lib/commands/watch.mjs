import {RunWatcher} from "../watch/load/run_watcher.mjs";

export async function watch(options, _programOpts) {
    const watcher = new RunWatcher(options);
    await watcher.watch();
}

