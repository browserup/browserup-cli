import { AxiosError } from "axios";

export function logErrors( e = null) {
    log.info("Errors:");
    let msg = e ? `${e.msg || ''}${e.message}` : e.message;
    log.info( ` * ${msg}`);

    if (e && (e instanceof AxiosError) || (e instanceof AggregateError))     {
        log.debug(e);
        log.debug(`Axios Communication Error: ${e.msg}`);
    }

    if (global.errors && Array.isArray(global.errors) && global.errors.length > 0) {
        global.errors.forEach(err => { log.info( ` * ${err}`); });
    }
    if (e && e.stack && (log.getLevel() <= log.levels.DEBUG)) {
        log.debug(e.stack.toString());
    }

    return msg;
}

