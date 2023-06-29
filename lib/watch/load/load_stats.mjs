import blessed from "neo-blessed";
import {printKeyValueArrayInBox} from "../helpers.mjs";
import {View} from "./view.mjs";
import contrib from "neo-blessed-contrib";

export class LoadStats extends View {
    constructor(props) {
        super(props);
    }

    // use components to keep track of all items managed by this view
    // we use these for hiding and showing items.
    initComponents() {
        this.components.timingsBox = null;
        this.components.stepsBox = null;
        this.components.responseCodeBox = null;
    }

    name() {
        return "stats";
    }

    draw() {
        this.components.timingsBox = this.grid.set(0, 11, 8, 8, blessed.box, {
            style: { text: 27},
            label: "Timings (ms)",
            tags: true,
            xLabelPadding: 3,
            xPadding: 5
        });

        this.components.responseCodeBox = this.grid.set(8, 16, 6, 8, contrib.table, {
            keys: true, fg: "white", selectedFg: "white", columnWidth: [12, 10, 10],
            selectedBg: "blue", interactive: true, height: "30%", border: {type: "line", fg: 27}, columnSpacing: 3
        });

        this.components.stepsBox = this.grid.set(16, 9, 5, 12, contrib.table, {
            keys: true,
            fg: 27,
            selectedFg: "white",
            selectedBg: "blue",
            interactive: true,
            width: "50%",
            height: "30%",
            columnSpacing: 4,
            columnWidth: [18, 18, 6, 6, 6]
        });
    }

    async update(data) {
        printKeyValueArrayInBox(data.timings, this.components.timingsBox);
        this.components.responseCodeBox.setData({headers: ["Status", "Count", "Percent"], data: data.response_codes});
        this.components.stepsBox.setData({headers: ["Profile", "Step", "Mean", "Max", "90th"], data: data.steps_table});
        this.screen.render();
    }

}
