import axios from "axios";

export class RemoteRuns {
    static async activeRunIds(credentials, scenarioId = null) {
        log.debug(`Loading Run IDs with active status, scenario ID filter: ${scenarioId}`);

        try {
            const response = await axios.get(`${credentials.clusterUrl}/load/runs`, {
                params: {
                    api_token: credentials.apiToken,
                    active: true,
                    scenario_name: scenarioId,
                },
                headers: {
                    accept: "application/json",
                },
            });

            const runIds = response.data;
            log.debug(`Active run ids: ${runIds}`);
            return runIds;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                log.error("Failure loading active run");
                throw new Error(`Authorization failed while getting run ID"s with ${credentials.apiToken}`);
            } else if (error.code === "ECONNREFUSED") {
                throw new Error(`Unable to connect to BrowserUp Server at ${credentials.clusterUrl}`);
            } else {
                throw error;
            }
        }
    }
}

export default RemoteRuns;
