import { AxiosError } from "axios";

export function logErrors( e = null) {
    log.info("Errors:");

    let msg = e.msg;
    let message = e.message;
    if(msg != message) {
        message = `${msg} \n(${message})`;
    }

    log.info( ` * ${message}`);

    if (e && (e instanceof AxiosError) || (e instanceof AggregateError))     {
        log.debug(e);
        log.debug(`Axios Communication Error: ${e.msg}`);
    }

    if (global.errors && Array.isArray(global.errors) && global.errors.length > 0) {
        global.errors.forEach(err => { log.debug( ` * ${err}`); });
    }
    if (e && e.stack && (log.getLevel() <= log.levels.DEBUG)) {
        log.debug(e.stack.toString());
    }

    return msg;
}

