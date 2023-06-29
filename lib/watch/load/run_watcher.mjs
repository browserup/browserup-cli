import blessed from 'neo-blessed';
import contrib from 'neo-blessed-contrib';
import axios from "axios";
import {ClusterCredentialsRepository} from "../../services/cluster_credentials_repository.mjs"
import {LoadDashboard} from "./load_dashboard.mjs";
import {LoadStats} from "./load_stats.mjs";
import {LoadLocations} from "./load_locations.mjs";

export class RunWatcher {
    constructor(options) {
        this.refreshInterval = options.refreshInterval || 15000;
        const creds= ClusterCredentialsRepository.getCredentials(options, ["clusterUrl", "apiToken"]);
        this.runId = options.runId || creds.lastRunId;
        this.appRoot = options.appRoot || creds.clusterUrl;
        this.statusUrl = `${this.appRoot}/load/reports/status?api_token=${creds.apiToken}${this.runId ? `&run_id=${this.runId}` : ""}`;
        this.screen = blessed.screen(   { terminal: 'xterm-256color'});
        this.grid = new contrib.grid({rows: 24, cols: 24, screen: this.screen, color: 117, border: {type: "line"}});

        this.screen.key(["escape", "q", "C-c"], (_ch, _key) => {
            return process.exit(0);
        });

        // this is universal to all views
        let menuBox =  this.grid.set(21, 0, 3, 24, blessed.listbar,
            { bottom: 0,
                left: 0,
                align: 'center',
                height: 1, style: {
                border: { fg: 'white' }
            }});

        menuBox.setItems({
            "dashboard": { keys: ["d"], callback: () => {
                    this.hideAll();
                    this.activeView = this.views.dashboard;
                    this.activeView.show();
                    this.screen.render()
                }},
            "locations": { keys: ["l"], callback: () => {
                    this.hideAll();
                    this.activeView = this.views.locations;
                    this.activeView.show();
                    this.screen.render()
                }},
                "stats": {
                    keys: ["s"], callback: () => {
                        this.hideAll();
                        this.activeView = this.views.stats;
                        this.activeView.show();
                        this.screen.render()
                    },
                },
            "quit": {keys: ["q"], callback: () => process.exit()}
        });

        let dashBoard = new LoadDashboard(this);
        dashBoard.draw();
        let stats = new LoadStats(this);
        stats.draw();
        let locations = new LoadLocations(this);
        locations.draw();
        this.views = { dashboard: dashBoard, stats: stats, locations: locations };
        this.setActiveView("dashboard");
        this.screen.render();
    }

    hideAll(){
        for (let viewName in this.views) {
           this.views[viewName].hide();
        }
    }

    getActiveView() { return this.activeView };

    setActiveView(viewName) {
        this.hideAll();
        this.activeView = this.views[viewName];
        this.activeView.show();
        this.screen.render();
    }

    appRoot() { return this.appRoot }
    statusUrl() { return this.statusUrl }

    async watch() {
        console.log("Connecting...  Press (q) to quit at any time.");
        await this.loadStatusScreen();
        setInterval(this.loadStatusScreen.bind(this), this.refreshInterval);
    }

    // Update all screens. We make a single API call and pass the data to each screen.
    async updateScreens(data){
        // for each screen, call update with the data
        for (let viewName in this.views) {
            await this.views[viewName].update(data);
        }
    }

    async loadStatusScreen() {
        try {
            const response = await axios.get(this.statusUrl);
            await this.updateScreens(response.data);

        } catch (e) {
            log.info(e);
            console.log(`Network Error Reaching: ${this.statusUrl} - Retrying in ${this.refreshInterval} ms.`);
        }
    }
}
