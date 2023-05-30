import retry from 'async-await-retry';
import {decoratedError} from "../browserup_errors.mjs";

/**
 * Abstraction over retry library
 */
export class Retry {
    static async retry({retryFunc, waitStrategy, retryableErrorTypes}) {
        let startTime = Date.now();
        let func = async () => {
            let elapsedTime = Date.now() - startTime;
            if (elapsedTime >= waitStrategy.maxElapsedTimeSec * 1000) {
                throw decoratedError(`Max timeout exceeded (${elapsedTime / 1000} sec)`)
            }
            await retryFunc();
        }
        return await retry(
            func,
            null,
            {
                onAttemptFail: (data) => {
                    return this.#onAttemptFail(data, retryableErrorTypes)
                },
                retriesMax: waitStrategy.retries,
                factor: 1,
                interval: waitStrategy.delaySec * 1000,
            }
        )
    }

    static #onAttemptFail(failedAttemptData, retryableErrorTypes) {
        if (failedAttemptData.error.type === undefined) {
            throw decoratedError({ msg: "Unknown error occurred", error: failedAttemptData.error });
        }
        if (!Array.isArray(retryableErrorTypes) || !retryableErrorTypes.includes(failedAttemptData.error.type)) {
            throw decoratedError({ msg: "Non-retriable error occurred", error: failedAttemptData.error })
        }
        return true;
    }
}
