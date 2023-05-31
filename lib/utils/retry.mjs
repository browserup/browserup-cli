import { retry } from '@lifeomic/attempt';

/**
 * Abstraction over retry library
 */
export class Retry {
    static async retry({retryFunc, waitStrategy, retryableErrorTypes}) {
        log.debug(`Retrying with delay: ${waitStrategy.delaySec}s, max attempts: ${waitStrategy.retries}, timeout: ${waitStrategy.maxElapsedTimeSec}s`)
        return await retry(async function() {
            return await retryFunc()
        }, {
            delay: waitStrategy.delaySec * 1000,
            factor: 1,
            maxAttempts: waitStrategy.retries,
            timeout: waitStrategy.maxElapsedTimeSec * 1000,
            handleError (err, context) {
                if (!Retry.isErrorRetriable(err, retryableErrorTypes)) {
                    context.abort();
                }
            }
        });
    }

    static isErrorRetriable(error, retryableErrorTypes) {
        if (error.type === undefined) {
            return false;
        }
        return Array.isArray(retryableErrorTypes) && retryableErrorTypes.includes(error.type);
    }
}
