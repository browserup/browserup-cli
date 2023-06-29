import contrib from "neo-blessed-contrib";
import {View} from "./view.mjs";

const awsRegions = {
    "us-east-1": {display_name: "Virginia,US", latitude: 38.9940541, longitude: -77.4524237},
    "us-east-2": {display_name: "Ohio,US", latitude: 40.0946354, longitude: -82.7541337},
    "us-west-1": {display_name: "California,US", latitude: 37.443680, longitude: -122.153664},
    "us-west-2": {display_name: "Oregon,US", latitude: 45.9174667, longitude: -119.2684488},
    "ca-central-1": {display_name: "Canada Central,CA", latitude: 45.5, longitude: -73.6},
    "ap-south-1": {display_name: "Mumbai,IN", latitude: 19.2425503, longitude: 72.9667878},
    "ap-northeast-2": {display_name: "Seoul,KR", latitude: 37.5616592, longitude: 126.8736237},
    "ap-southeast-1": {display_name: "Singapore,SG", latitude: 1.3218269, longitude: 103.6930643},
    "ap-southeast-2": {display_name: "Sydney,AU", latitude: -33.9117717, longitude: 151.1907535},
    "ap-northeast-1": {display_name: "Tokyo,JP", latitude: 35.617436, longitude: 139.7459176},
    "eu-central-1": {display_name: "Frankfurt,DE", latitude: 50.0992094, longitude: 8.6303932},
    "eu-west-1": {display_name: "Ireland,IE", latitude: 53.4056545, longitude: -6.224503},
    "eu-west-2": {display_name: "London,GB", latitude: 51.5085036, longitude: -0.0609266},
    "eu-west-3": {display_name: "Paris,FR", latitude: 48.6009709, longitude: 2.2976644},
    "sa-east-1": {display_name: "São Paulo,BR", latitude: -23.4925798, longitude: -46.8105593},
    "af-south-1": {display_name: "Cape Town,ZA", latitude: -33.914651, longitude: 18.3758801},
    "eu-north-1": {display_name: "Stockholm,SE", latitude: 59.326242, longitude: 17.8419717},
    "eu-south-1": {display_name: "Milan,IT", latitude: 45.4628328, longitude: 9.1076927},
    "me-south-1": {display_name: "Bahrain,BH", latitude: 25.941298, longitude: 50.3073907},
    "ap-east-1": {display_name: "Hong Kong,HK", latitude: 22.2908475, longitude: 114.2723379},
    "cn-north-1": {display_name: "Beijing,CN", latitude: 39.8094478, longitude: 116.5783234},
    "cn-northwest-1": {display_name: "Ningxia,CN", latitude: 37.5024418, longitude: 105.1627193},
};


export class LoadLocations extends View {
    constructor(props) {
        super(props);
    }

    // use components to keep track of all items managed by this view
    // we use these for hiding and showing items.
    initComponents() {
        this.components.locations = null;
    }

    name() {
        return "Locations";
    }

    draw() {
        this.components.locations = this.components.locations = this.grid.set(0, 0, 20, 24, contrib.map, {
            style: { fg: 27},
        });
        this.components.locations.addMarker({"lon" : "-79.0000", "lat" : "37.5000", color: "red", char: "X" });
    }

    async update(data) {
        if (data.locations && Array.isArray(data.locations) ){
            this.components.locations.clearMarkers();
            if (data.locations.length > 0) {
                //for each item in data.locations if it is a valid region add a marker with the latitute and longitude
                data.locations.forEach((location) => {
                    if (awsRegions[location]) {
                        this.components.locations.addMarker({"lon" : awsRegions[location].longitude, "lat" : awsRegions[location].latitude, color: "red", char: "X" });
                    }
                });
            }
        }
        this.screen.render();
    }

}
