export class View {

    constructor(watcher) {
        this.screen = watcher.screen;
        this.grid = watcher.grid;
        this.components = {};
        this.initComponents();
        this.setResize();
    }

    setResize() {
        this.screen.on("resize", function () {
            // We use a JS loop and runfor each component in this.components and emit the attach event for each one.
            // This is a hack to get around the fact that blessed-contrib doesn't have a resize event.
            // We need to emit the attach event so that blessed-contrib will redraw the component.
            for(const [_name, component] of Object.entries(this.components)) {
                if (component) { component.emit("attach"); }
            }
        }.bind(this));
    }

    hide() {
        // for each component in this.components, hide it if it exists
        for (const [name, component] of Object.entries(this.components)) {
            if (component) {
                component.hide();
            }
        }
    }

    show() {
        // for each component in this.components, hide it if it exists
        for (const [name, component] of Object.entries(this.components)) {
            if (component) {
                component.show();
            }
        }
    }
}
