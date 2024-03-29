import fetch from "node-fetch";
import {AwsCfClient} from "./aws/aws_cf_client.mjs";

export class GrafanaClient {
    static REQUEST_HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    static READ_TIMEOUT_SEC = 5 * 1000; // Converted to milliseconds
    static OPEN_TIMEOUT_SEC = 5 * 1000; // Converted to milliseconds

    constructor(clusterUrl, port, username, password) {
        this.clusterUrl = clusterUrl;
        this.port = port;
        this.username = username;
        this.password = password;
    }

    async createZookeeperDashboard() {
        await this.createBrowserupDashboard("grafana-zookeeper-dashboard.json", "Zookeeper")
    }

    async createGridServicesDashboard() {
        await this.createBrowserupDashboard("grafana-grid-services-dashboard.json", "Grid Services")
    }

    async createDefaultDashboard() {
        await this.createBrowserupDashboard("grafana-default-dashboard.json", "Default", true)
    }

    async createBrowserupDashboard(awsResourceFileName, dashboardName, makeDefault = false) {
        log.debug(`Creating '${dashboardName}' Grafana dashboard`);

        const url = new URL(this.clusterUrl);
        url.port = this.port;
        url.pathname = "/api/dashboards/db";

        const dashboard_json = await AwsCfClient.readAwsResource(awsResourceFileName);
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
            log.debug(`Created '${dashboardName}' Grafana dashboard`);
            const responseBody = await response.json();
            if (makeDefault) {
                const dashboard_id = responseBody["id"];
                if (dashboard_id !== null) {
                    await this.updateDefaultDashboard(dashboard_id);
                }
            }
        } else {
            log.warn(`Failed to create Grafana dashboard, got code: ${response.status}`);
        }
    }

    async updateDefaultDashboard(dashboard_id) {
        const url = new URL(this.clusterUrl);
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
