import { BrowserUpError, ErrorType, decoratedError, ExitProcessError } from "../browserup_errors.mjs";
import {AxiosError} from "axios";

export async function logAndExit(msg, e = null) {
    log.info("Errors:");
    msg = e ? `${e.msg}${e.message}` : msg;
    //${msg}\n
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

    if(global.exitOverride) {
        log.debug('exit overriding');
        let e = new ExitProcessError();
        throw e;
    }
    else {
        process.exit(1);
    }
    return msg;
}

