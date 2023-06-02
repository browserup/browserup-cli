import * as rax from 'retry-axios';
import axios from 'axios';
import {decoratedError, ErrorType} from "../browserup_errors.mjs";
import {LogSpinner} from "../utils/log_spinner.mjs";
import {BrowserUpUrl} from "../utils/browserup_url.mjs";

export class WebConsoleClient {
    static WAIT_FOR_WEBCONSOLE = {
        delaySec: 3,
        retries: 120,
        maxElapsedTimeSec: 1000,
    };

    static async sendPathRequest({path, qParams = {}, data, extraHeaders = {}, expectedCodes = [200, 201]}) {
        return this.sendRequest({
            path: path,
            qParams: qParams,
            method: 'patch',
            expectedCodes: expectedCodes,
            data: data,
            extraHeaders: extraHeaders
        })
    }

    static async sendPostRequest({path, qParams = {}, data, extraHeaders = {}, expectedCodes = [200, 201]}) {
        return this.sendRequest({
            path: path,
            qParams: qParams,
            method: 'post',
            expectedCodes: expectedCodes,
            data: data,
            extraHeaders: extraHeaders
        })
    }

    static async sendPutRequest({path, qParams = {}, data, extraHeaders = {}, expectedCodes = [200, 201]}) {
        return this.sendRequest({
            path: path,
            qParams: qParams,
            method: 'put',
            expectedCodes: expectedCodes,
            data: data,
            extraHeaders: extraHeaders
        })
    }

    static async sendGetRequest({path, qParams = {}, expectedCodes = [200, 201]}) {
        return this.sendRequest({
            path: path,
            qParams: qParams,
            method: 'get',
            expectedCodes: expectedCodes
        })
    }

    static async sendRequest({path, qParams = {}, data, extraHeaders = {}, method, expectedCodes = [200, 201]}) {
        const headers = {
            Accept: "application/json",
            ...extraHeaders
        }
        const config = {
            url: this.getWebconsoleURL(path),
            method: method,
            params: qParams,
            data: data,
            validateStatus: status => expectedCodes.includes(status),
            headers: headers
        }
        const response = await axios.request(config)
        if (expectedCodes.includes(response.status)) {
            return response;
        } else {
            throw decoratedError(`Unexpected response from WebConsole: ${response.statusText}`);
        }
    }

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
                headers: {Accept: "application/json"}
            });

            const health = response.data;

            health.forEach((svc) => {
                if (svc["value"] !== "UP") {
                    throw decoratedError(`${svc["id"]} not ready`);
                }
            });
        } catch (e) {
            throw decoratedError(`App not ready at ${railsHealthyUrl}`);
        } finally {
            LogSpinner.stop();
        }
    }

    static getWebconsoleURL(path) {
        return `${BrowserUpUrl.browserupUrl()}/${path}`
    }
}
