import * as rax from 'retry-axios';
import axios from 'axios';
import { decoratedError } from "../browserup_errors.mjs";
import {LogSpinner} from "../utils/log_spinner.mjs";

export class WebConsoleClient {
    static WAIT_FOR_WEBCONSOLE = {
        delaySec: 3,
        retries: 120,
        maxElapsedTimeSec: 1000,
    };

    static async waitForRailsReady(webconsoleUrl) {
        const railsHealthyUrl = `${webconsoleUrl}/load/health_checks`;

        let waitMsg = `Waiting up to ${WebConsoleClient.WAIT_FOR_WEBCONSOLE.maxElapsedTimeSec} seconds for ${railsHealthyUrl}`
        LogSpinner.start(waitMsg)

        try {
            const axiosInstance = axios.create();

            axiosInstance.defaults.raxConfig = {
                instance: axiosInstance,
                retry: WebConsoleClient.WAIT_FOR_WEBCONSOLE.retries,
                noResponseRetries: WebConsoleClient.WAIT_FOR_WEBCONSOLE.retries,
                retryDelay: WebConsoleClient.WAIT_FOR_WEBCONSOLE.delaySec * 1000,
                httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'],
                backoffType: "static",
            };
            rax.attach(axiosInstance);

            const response = await axiosInstance.get(railsHealthyUrl, {
                timeout: 5000,
                headers: { Accept: "application/json" }
            });

            const health = response.data;

            health.forEach((svc) => {
                if (svc["value"] !== "UP") {
                    throw decoratedError(`${svc["id"]} not ready`);
                }
            });
        } catch (e) {
            throw decoratedError(`App not ready at ${railsHealthyUrl}`);
        }
        finally {
            LogSpinner.stop();
        }
    }
}
