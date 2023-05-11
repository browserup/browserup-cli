import blessed from "blessed";
import contrib from "blessed-contrib";
import fs from "fs";
import path from "path";
import axios from "axios";
import {logAndExit} from "../utils/cli_helpers.mjs";
import {EOL as endOfLine} from "os";

let screen = null;
let runInfoBox = null;
let stepsLine = null;
let sparkline = null;
let logoBox = null;
let grid = null;
let timingsBox = null;
let responseCodeBox = null;
let runStatsTable = null;
let stepsBox = null;

const refresh_interval = 15000;

const runId = process.argv[2];
const app_root = process.env.APP_ROOT || "http://localhost:3000";
const statusUrl = `${app_root}/load/reports/status?api_token=${process.env.BROWSERUP_API_KEY}${runId ? `&run_id=${runId}` : ""}`;

export function consoleStart(options, program_opts) {
    log.info("Connecting...  Press (q) to quit at any time.");
    loadStatusScreen().then(() => {
        setInterval(loadStatusScreen, refresh_interval);
    }).catch((error) => { logAndExit(error);  });
}


function buildStatusScreen() {
    screen = blessed.screen();
    grid = new contrib.grid({rows: 24, cols: 24, screen: screen, color: "white", border: {type: "line"}});

    // --- top row ---
    // row, col, rowspan, colspan
    logoBox = grid.set(0, 0, 8, 11, blessed.box, {
        style: {border: {type: "bg"}, fg: "green"},
        tags: true, xLabelPadding: 3, xPadding: 5
    });
    logoBox.insertTop(fs.readFileSync(path.join(__dirname, "../files/assets/browserup-logo.txt"), "utf8").split("\n"));

    runInfoBox = grid.set(0, 11, 8, 8, blessed.box, {
        style: {line: "blue", text: "green", baseline: "black"},
        tags: true,
        xLabelPadding: 3,
        xPadding: 5
    });

    sparkline = grid.set(0, 19, 8, 3, contrib.sparkline, {tags: true, style: {fg: "blue", titleFg: "white"}});

    // --- middle row ---

    stepsLine = grid.set(8, 0, 8, 11, contrib.line, {
        left: 20,
        top: 12,
        xPadding: 5,
        label: "Average load time",
        showLegend: true,
        legend: {width: 25}
    });

    timingsBox = grid.set(8, 11, 8, 5, blessed.box, {
        style: {line: "blue", text: "green"},
        label: "Timings (ms)",
        tags: true,
        xLabelPadding: 3,
        xPadding: 5
    });

    responseCodeBox = grid.set(8, 16, 8, 6, contrib.table, {
        keys: true, fg: "white", selectedFg: "white", columnWidth: [12, 10, 10],
        selectedBg: "blue", interactive: true, height: "30%", border: {type: "line", fg: "cyan"}, columnSpacing: 3
    });

// --- bottom row ---

    runStatsTable = grid.set(16, 0, 8, 9, contrib.table,
        {
            keys: true, fg: "white", selectedFg: "white", selectedBg: "blue", interactive: true, height: "30%",
            border: {type: "line", fg: "cyan"}, columnSpacing: 4, columnWidth: [20, 15, 15]
        });

    stepsBox = grid.set(16, 9, 8, 13, contrib.table,
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

    screen.key(["escape", "q", "C-c"], function (ch, key) {
        return process.exit(0);
    });

    // fixes https://github.com/yaronn/blessed-contrib/issues/10
    screen.on("resize", function () {
        sparkline.emit("attach");
        logoBox.emit("attach");
    });
    screen.render();
}

function clearScreen() {
    logoBox = grid.set(0, 0, 24, 24, blessed.box, {
        style: {fg: "green", baseline: "black"},
        tags: true,
        xLabelPadding: 3,
        xPadding: 5
    });
    screen.render();
}

function nextMagnitude(n) {
    return Math.pow(10, Math.ceil(Math.log(n) / Math.LN10 + 0.000000001));  // float math yuck
}



async function updateStatusScreen(body) {
    if (screen == null) {
        buildStatusScreen();
    }

    keyValueBox.printKeyValueArrayInBox(body.run, runInfoBox);
    keyValueBox.printKeyValueArrayInBox(body.timings, timingsBox);

    runStatsTable.setData({headers: ["", "Cumulative", "Last 2 min"], data: body.stats});
    responseCodeBox.setData({headers: ["Status", "Count", "Percent"], data: body.response_codes});
    stepsBox.setData({headers: ["Profile", "Step", "Mean", "Max", "90th"], data: body.steps_table});

    let array_of_series = body.steps.data;
    stepsLine.options.maxY = nextMagnitude(body.steps.metadata.y.max * 1.20);
    stepsLine.setData(array_of_series);
    stepsLine.render();

    sparkline.setData(["Users", "Kilobytes/Sec", "Request/Sec"], [body.spark.users, body.spark.throughput, body.spark.hits]);
    screen.render();
}

async function loadStatusScreen() {
    try {
        const response = await axios.get(statusUrl);
        updateStatusScreen(response.data);
    } catch (error) {
        log.info(`Network Error Reaching: ${app_root} - Retrying in ${refresh_interval} ms.`);
    }
}


function printKeyValueArrayInBox(arr, box) {

    var statusString = ""
    for (let lineArr of arr) {
        var keystr = " " + chalk.green(lineArr[0] + ":  ")
        var valuestr = chalk.white(lineArr[1])
        statusString += this.padStr("                                   ", keystr, false) + valuestr + endOfLine
    }
    box.setContent(statusString)
}

function padStr(pad, str, padLeft) {
    if (typeof str === "undefined")
        return pad;
    if (padLeft) {
        return (pad + str).slice(-pad.length);
    } else {
        return (str + pad).substring(0, pad.length);
    }
}

function checkAPIKeyorMessage(){
    if (process.env.BROWSERUP_API_KEY === undefined) {

        let msg = `
------------------------------------------------------------------------
Please get an API key from the app and export it as BROWSERUP_API_KEY.
------------------------------------------------------------------------`;

        process.stdout.write(msg, () => {
            // process.exit(1);
        });
    };
}
