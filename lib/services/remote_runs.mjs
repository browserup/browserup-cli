import axios from "axios";
import {decoratedError} from "../browserup_errors.mjs";

export class RemoteRuns {
    static async activeRunIds(credentials, scenarioId = null) {
        try {
            log.debug(`Loading Run IDs with active status, scenario ID filter: ${scenarioId}`);

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
        } catch (e) {

            if (e.response && e.response.status === 401) {
                log.error("Failure loading active run");
                throw decoratedError(`Authorization failed while getting run ID"s with ${credentials.apiToken}`);
            } else if (e.code === "ECONNREFUSED") {
                throw decoratedError(`Unable to connect to BrowserUp Server at ${credentials.clusterUrl}`);
            } else {
                throw e;
            }
        }
    }

}

export default RemoteRuns;
