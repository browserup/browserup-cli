import fetch from "node-fetch";
import {AwsCfClient} from "./aws_cf_client.mjs";

export class GrafanaClient {
    static REQUEST_HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    static READ_TIMEOUT_SEC = 5 * 1000; // Converted to milliseconds
    static OPEN_TIMEOUT_SEC = 5 * 1000; // Converted to milliseconds

    constructor(cluster_url, port, username, password) {
        this.cluster_url = cluster_url;
        this.port = port;
        this.username = username;
        this.password = password;
    }

    async createBrowserupDashboard() {
        log.debug("Creating Grafana dashboard");

        const url = new URL(this.cluster_url);
        url.port = this.port;
        url.pathname = "/api/dashboards/db";

        const dashboard_json = await AwsCfClient.readAwsResource("grafana-default-dashboard.json");
        const request_body = JSON.stringify({
            "dashboard": JSON.parse(dashboard_json),
            "folderId": 0,
            "message": "",
            "overwrite": true
        });

        const response = await fetch(url, {
            method: "POST",
            headers: {
                ...GrafanaClient.REQUEST_HEADERS,
                "Authorization": "Basic " + Buffer.from(this.username + ":" + this.password).toString("base64")
            },
            body: request_body,
            timeout: GrafanaClient.OPEN_TIMEOUT_SEC
        });

        if (response.status === 200) {
            log.debug("Created Grafana dashboard");
            const responseBody = await response.json();
            const dashboard_id = responseBody["id"];
            if (dashboard_id !== null) {
                await this.updateDefaultDashboard(dashboard_id);
            }
        } else {
            log.warn(`Failed to create Grafana dashboard, got code: ${response.status}`);
        }
    }

    async updateDefaultDashboard(dashboard_id) {
        const url = new URL(this.cluster_url);
        url.port = this.port;
        url.pathname = "/api/user/preferences";

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                ...GrafanaClient.REQUEST_HEADERS,
                "Authorization": "Basic " + Buffer.from(this.username + ":" + this.password).toString("base64")
            },
            body: JSON.stringify({"homeDashboardId": dashboard_id}),
            timeout: GrafanaClient.OPEN_TIMEOUT_SEC
        });

        if (response.status === 200) {
            log.debug("Update default Grafana dashboard");
        } else {
            log.warn(`Failed to set default Grafana dashboard, got code: ${response.status}`);
        }
    }
}
export default GrafanaClient;
