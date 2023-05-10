
export function logAndExit(msg, e = null) {
    log.info("Errors:");
    msg = e ? `${msg}\n${e.message}` : msg;

    log.info( ` * ${msg}`);

    if (global.errors && Array.isArray(global.errors) && global.errors.length > 0) {
        global.errors.forEach(err => { log.info( ` * ${err}`); });
    }
    if (e && e.stack) {
        log.error(e.stack);
    }

    if (!global.exitOverride) {
        return process.exit(1);
    }
    return msg;
}

