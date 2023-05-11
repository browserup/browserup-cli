import "axios";
import "retry-axios";
import ora from "ora";

export class WebConsoleClient {
    static WAIT_FOR_WEBCONSOLE = {
        delay_sec: 3,
        retries: 120,
        max_elapsed_time_sec: 1000,
    };

    static async wait_for_rails_ready(webconsole_url) {
        const rails_healthy_url = `${webconsole_url}/load/health_checks`;

        let waitMsg =             `Waiting up to ${
            WebConsoleClient.WAIT_FOR_WEBCONSOLE.max_elapsed_time_sec
        } seconds for ${rails_healthy_url}...`

        const spinner = ora(waitMsg).start();

        try {
            const axiosInstance = axios.create();
            axiosInstance.defaults.raxConfig = {
                retry: WebConsoleClient.WAIT_FOR_WEBCONSOLE.retries,
                noResponseRetries: WebConsoleClient.WAIT_FOR_WEBCONSOLE.retries,
                retryDelay: WebConsoleClient.WAIT_FOR_WEBCONSOLE.delay_sec * 1000,
                httpMethodsToRetry: ["GET"],
                backoffType: "static",
            };
            rax.attach(axiosInstance);
            let httpAgent, httpsAgent;

            if (webconsole_url.includes("https")) {
                const { Agent } = await import("http");
                httpAgent = new Agent();
            }else {
                const { Agent } = await import("https");
                httpsAgent = new Agent({ rejectUnauthorized: false });
            }

            const response = await axiosInstance.get(rails_healthy_url, {
                timeout: 5000,
                headers: { Accept: "application/json" },
                httpAgent: httpAgent,
                httpsAgent: httpsAgent,
            });

            const health = response.data;

            health.forEach((svc) => {
                if (svc["value"] !== "UP") {
                    throw new Error(`${svc["id"]} not ready`);
                }
            });
        } catch (error) {
            throw new Error(`App not ready at ${rails_healthy_url}`);
        }
        finally {
            spinner.stop();
        }
    }
}
