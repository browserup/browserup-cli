import blessed from "neo-blessed";
import contrib from "neo-blessed-contrib";
import {printKeyValueArrayInBox} from "../helpers.mjs";
import {nextMagnitude} from "../helpers.mjs";
import {View} from "./view.mjs";

export class LoadDashboard extends View {
    constructor(props) {
        super(props);
    }

    // use components to keep track of all items managed by this view. We use these for hiding and showing items.
    initComponents() {
        this.components = {};
        this.components.summaryBox = null;
        this.components.responseTime = null;
        this.components.usersThroughput = null;
        this.components.logoBox = null;
        this.components.runStatsTable = null;
    }

    name() {
        return "dashboard";
    }

    async update(data) {
        printKeyValueArrayInBox(data.run, this.summaryBox);
        this.components.runStatsTable.setData({headers: ["", "Cumulative", "Last"], data: data.stats});

        let arrayOfSeries = data.steps.data;
        this.components.responseTime.options.maxY = nextMagnitude(data.steps.metadata.y.max * 1.10);
        this.components.responseTime.setData(arrayOfSeries);
        this.components.usersThroughput.setData(["Users", 'Kilobytes/Sec', 'Request/Sec'], [data.spark.users, data.spark.throughput, data.spark.hits]);
        this.screen.render();
        this.components.runStatsTable.focus();
    }

    draw() {
        this.summaryBox = this.grid.set(0, 0, 6, 11, blessed.box, {
            style: { bg: 0, },
            tags: true, xLabelPadding: 3, xPadding: 5,
            label: '{#FFA500-fg}Browser{gray-fg}Up'
        });

        this.components.usersThroughput= this.grid.set(6, 0, 10, 6, contrib.sparkline,
            {tags: true, style: {fg: "blue", titleFg: "white"}});

        this.components.responseTime = this.grid.set(0, 11, 10, 12, contrib.line, {
            left: 20,
            top: 12,
            xPadding: 5,
            label: "Average load time",
            style: {line: "red", baseline: 27 },
        });

        this.components.responseTime = this.grid.set(0, 11, 10, 12, contrib.line, {
            left: 20,
            top: 12,
            xPadding: 5,
            label: "Average load time",
            style: {line: "red", baseline: 27 },
        });

        this.components.runStatsTable = this.grid.set(16, 0, 5, 9, contrib.table,
            { keys: true, fg: "white", selectedFg: "white", selectedBg: "blue", interactive: true, height: "30%",
                columnSpacing: 4, columnWidth: [20, 15, 15] });

    }
}
