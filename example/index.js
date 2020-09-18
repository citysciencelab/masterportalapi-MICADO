// needed for dev mode since parcel babels async/await
import "babel-polyfill";
import "ol/ol.css";

import {Style, Stroke, Fill} from "ol/style.js";

import * as mpapi from "../src";

import services from "./config/services.json";
import portalConfig from "./config/portal.json";
import localGeoJSON from "./config/localGeoJSON.js";

const hamburgServicesUrl = "https://geoportal-hamburg.de/lgv-config/services-internet.json";

//* Add elements to window to play with API in console
window.mpapi = {
    ...mpapi,
    map: null
};
// */

//* Cleans up map before it is re-rendered (happens on every save during dev mode)
document.getElementById(portalConfig.target).innerHTML = "";
// */

//* Fake service that holds client-side prepared geojson; also nice to test automatic transformation since data is in WGS 84
const localService = {
    id: "2002",
    typ: "GeoJSON",
    features: localGeoJSON
};

//* Fake service that calls layers from hmdk by md_id
const mdIdService = {
    md_id: "9F0CF4ED-A570-4856-B0EC-BBAD5A2E3D0C"
};

services.push(localService);
services.push(mdIdService);

//* geojson styling function call to override default styling
mpapi.geojson.setCustomStyles({
    MultiPolygon: new Style({
        stroke: new Stroke({
            width: 2,
            color: "#000000"
        }),
        fill: new Fill({
            color: "#FFFFFF55"
        })
    })
});
// */

//* SYNCHRONOUS EXAMPLE: layerConf is known
window.mpapi.map = mpapi.createMap({
    ...portalConfig,
    layerConf: services
});

/**
 * Add additional Layers to the map
 * The layer can by passed as rawLayer-"id", "md_id" or ol/Layer object
 * "id": the layer is generated based on the rawLayer-Parameters
 * "md_id": refers to a dataset ID from the HDMK
 * 
 * The example md_id refers to all parcels (Flurstücke) in FHH
 */
["2001", "2002", "9F0CF4ED-A570-4856-B0EC-BBAD5A2E3D0C"].forEach(id =>
    window.mpapi.map.addLayer(id)
);

/**
 * Additional Layers can also be generated without being included in the portalConfig in advance
 * Parameter can either be an md_id for lookup in HDMK, if multiple layers refer to the same md_id, all are added
 * an object specifying the attributes to search for
 * or a rawLayer-Object, as retrieved from the default services.json
 * 
 * The createLayer method returns a thenable Promise, resolving the created layers
 */
// Golfplätze Metropolregion Hamburg, search-attribute provided as string
window.mpapi.map.createLayer("14DF2C11-AFA8-44E0-9EDD-F0AAB7F17CDB")
    .then(layers => console.log(layers));

/**
 * Potentially multiple multiple services can be addressed by the same parameters (e.g. md_id).
 * To avoid performance issues the number of layers retrieved can be capped by optional LayerLimit parameter.
 */
// Nahversorgung Eimsbüttel, LayerLimit = 2, search-attribute provided as JSON
window.mpapi.map.createLayer({md_id: "27C81813-7572-466C-9200-71704BC9C91E"}, 2);

// Feinkartierung Straßen
window.mpapi.map.createLayer({
    "id": "14864",
    "url": "https://geodienste.hamburg.de/HH_WMS_Feinkartierung_Strasse",
    "typ": "WMS"
}, 1);

/* ASYNCHRONOUS EXAMPLE 1: work with layerConf callback
mpapi.rawLayerList.initializeLayerList(
    hamburgServicesUrl,
    conf => {
        window.mpapi.map = mpapi.createMap({
            ...portalConfig,
            layerConf: conf,
            layers: null
        });
        ["6357", "6074"].forEach(
            id => window.mpapi.map.addLayer(id)
        );
    }
);
//*/

/* ASYNCHRONOUS EXAMPLE 2: work with createMap callback
window.mpapi.map = mpapi.createMap(
    {...portalConfig, layerConf: hamburgServicesUrl, layers: [
        { id: "6357" },
        { id: "453", transparency: 50 }
    ]},
    {
        callback: () =>
            ["6074"].forEach(
                id => window.mpapi.map.addLayer(id)
            )
    }
);
//*/

/* SEARCH FUNCTION EXAMPLE
// You may e.g. copy this code to the browser's console to run a search.

window.mpapi.search("Eiffe",  {
    map: window.mpapi.map,
    zoom: true,
    zoomToParams: {duration: 1000, maxZoom: 8},
    searchStreets: true
}).then(x => console.log(x)).catch(e => console.error(e))

window.mpapi.search("Mümmelmannsberg 72",  {
    map: window.mpapi.map,
    zoom: true,
    zoomToParams: {duration: 1000, maxZoom: 8},
    searchAddress: true
}).then(x => console.log(x)).catch(e => console.error(e))

//*/
