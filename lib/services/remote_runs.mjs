import {decoratedError} from "../browserup_errors.mjs";
import {WebConsoleClient} from "./webconsole_client.mjs";

export class RemoteRuns {
    static async activeRunIds(credentials, scenarioId = null) {
        try {
            log.debug(`Loading Run IDs with active status, scenario ID filter: ${scenarioId}`);
            const response = await WebConsoleClient.sendGetRequest({
                path: 'load/runs',
                qParams: {
                    api_token: credentials.apiToken,
                    active: true,
                    scenario_name: scenarioId
                }
            })
            const runIds = response.data;
            log.debug(`Active run ids: ${runIds}`);
            return runIds;
        } catch (e) {
            throw decoratedError({msg: `Failed to get active Run IDs by ${credentials.clusterUrl}`, error: e});
        }
    }
}
