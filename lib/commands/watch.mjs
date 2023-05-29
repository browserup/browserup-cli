import blessed from "blessed";
import contrib from "blessed-contrib";
import fs from "fs";
import path from "path";
import axios from "axios";
import chalk from "chalk";
import {EOL as endOfLine} from "os";
import {padStr} from "../utils/string.mjs";

export function watch(options, program_opts) {
    const watcher = new CliWatcher(options);
    watcher.watch();
}

export class CliWatcher {
    constructor(options) {
        this.refreshInterval = options.refreshInterval || 15000;
        this.runId = options.runId;
        this.appRoot = options.appRoot || "http://localhost:3000";
        this.statusUrl = `${this.appRoot}/load/reports/status?api_token=${options.browserUpApiKey}${this.runId ? `&run_id=${this.runId}` : ""}`;
        this.screen = null;
        this.runInfoBox = null;
        this.stepsLine = null;
        this.sparkline = null;
        this.logoBox = null;
        this.grid = null;
        this.timingsBox = null;
        this.responseCodeBox = null;
        this.runStatsTable = null;
        this.stepsBox = null;
    }

    appRoot() {
        return this.appRoot;
    }

    statusUrl() {
        return this.statusUrl;
    }

    async watch() {
        console.log("Connecting...  Press (q) to quit at any time.");
        await this.loadStatusScreen();
        setInterval(this.loadStatusScreen.bind(this), this.refreshInterval);
    }

    buildStatusScreen() {
        this.screen = blessed.screen();
        this.grid = new contrib.grid({rows: 24, cols: 24, screen: this.screen, color: "white", border: {type: "line"}});
        this.createTopRow();
        this.createMiddleRow();
        this.createBottomRow();

        this.screen.key(["escape", "q", "C-c"], function (ch, key) {
            return process.exit(0);
        });

        // fixes https://github.com/yaronn/blessed-contrib/issues/10
        this.screen.on("resize", function () {
            this.sparkline.emit("attach");
            this.logoBox.emit("attach");
        }.bind(this));
        this.screen.render();
    }

    createTopRow() {
        this.logoBox = this.grid.set(0, 0, 8, 11, blessed.box, {
            style: {border: {type: "bg"}, fg: "green"},
            tags: true, xLabelPadding: 3, xPadding: 5
        });
        this.logoBox.insertTop(fs.readFileSync(path.join(__dirname, "../files/assets/browserup-logo.txt"), "utf8").split("\n"));

        this.runInfoBox = this.grid.set(0, 11, 8, 8, blessed.box, {
            style: {line: "blue", text: "green", baseline: "black"},
            tags: true,
            xLabelPadding: 3,
            xPadding: 5
        });

        this.sparkline = this.grid.set(0, 19, 8, 3, contrib.sparkline, {tags: true, style: {fg: "blue", titleFg: "white"}});
    }

    createMiddleRow() {
        this.stepsLine = this.grid.set(8, 0, 8, 11, contrib.line, {
            left: 20,
            top: 12,
            xPadding: 5,
            label: "Average load time",
            showLegend: true,
            legend: {width: 25}
        });

        this.timingsBox = this.grid.set(8, 11, 8, 5, blessed.box, {
            style: {line: "blue", text: "green"},
            label: "Timings (ms)",
            tags: true,
            xLabelPadding: 3,
            xPadding: 5
        });

        this.responseCodeBox = this.grid.set(8, 16, 8, 6, contrib.table, {
            keys: true, fg: "white", selectedFg: "white", columnWidth: [12, 10, 10],
            selectedBg: "blue", interactive: true, height: "30%", border: {type: "line", fg: "cyan"}, columnSpacing: 3
        });
    }

    createBottomRow() {
        this.runStatsTable = this.grid.set(16, 0, 8, 9, contrib.table,
            {
                keys: true, fg: "white", selectedFg: "white", selectedBg: "blue", interactive: true, height: "30%",
                border: {type: "line", fg: "cyan"}, columnSpacing: 4, columnWidth: [20, 15, 15]
            });

        this.stepsBox = this.grid.set(16, 9, 8, 13, contrib.table,
            {
                keys: true,
                fg: "white",
                selectedFg: "white",
                selectedBg: "blue",
                interactive: true,
                width: "50%",
                height: "30%",
                border: {type: "line", fg: "cyan"},
                columnSpacing: 4,
                columnWidth: [18, 18, 6, 6, 6]
            });
    }

    clearScreen() {
        this.logoBox = this.grid.set(0, 0, 24, 24, blessed.box, {
            style: {fg: "green", baseline: "black"},
            tags: true,
            xLabelPadding: 3,
            xPadding: 5
        });
        this.screen.render();
    }

    nextMagnitude(n) {
        return Math.pow(10, Math.ceil(Math.log(n) / Math.LN10 + 0.000000001));  // float math yuck
    }

    async updateStatusScreen(body) {
        if (this.screen === null) {
            this.buildStatusScreen();
        }

        this.printKeyValueArrayInBox(body.run, this.runInfoBox);
        this.printKeyValueArrayInBox(body.timings, this.timingsBox);

        this.runStatsTable.setData({headers: ["", "Cumulative", "Last 2 min"], data: body.stats});
        this.responseCodeBox.setData({headers: ["Status", "Count", "Percent"], data: body.response_codes});
        this.stepsBox.setData({headers: ["Profile", "Step", "Mean", "Max", "90th"], data: body.steps_table});

        let arrayOfSeries = body.steps.data;
        this.stepsLine.options.maxY = this.nextMagnitude(body.steps.metadata.y.max * 1.20);
        this.stepsLine.setData(arrayOfSeries);
        this.stepsLine.render();

        this.sparkline.setData(["Users", "Kilobytes/Sec", "Request/Sec"], [body.spark.users, body.spark.throughput, body.spark.hits]);
        this.screen.render();
    }

    async loadStatusScreen() {
        try {
            const response = await axios.get(this.statusUrl);
            this.updateStatusScreen(response.data);
        } catch (e) {
            console.log(`Network Error Reaching: ${this.appRoot} - Retrying in ${this.refreshInterval} ms.`);
        }
    }

    printKeyValueArrayInBox(arr, box) {
        let statusString = ""
        for (let lineArr of arr) {
            let keystr = " " + chalk.green(lineArr[0] + ":  ")
            let valuestr = chalk.white(lineArr[1])
            statusString += padStr("                                   ",
                keystr, false) + valuestr + endOfLine
        }
        box.setContent(statusString)
    }


    checkApiKeyOrMessage(){
        if (this.browserUpApiKey === undefined) {

            let msg = `
------------------------------------------------------------------------
Please get an API key from the app and export it as BROWSERUP_API_KEY.
------------------------------------------------------------------------`;

            process.stdout.write(msg, () => {
                // process.exit(1);
            });
        }
    }
}
