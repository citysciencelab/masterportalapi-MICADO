import {Map, PluggableMap} from "ol";
import {defaults as olDefaultInteractions} from "ol/interaction.js";

import setBackgroundImage from "./lib/setBackgroundImage";
import getInitialLayers from "./lib/getInitialLayers";
import layerBuilderMap from "./layerBuilderMap";
import defaults from "./defaults";
import getRawLayer from "./lib/getRawLayer";
import {createMapView} from "./mapView";
import {initializeLayerList, getLayerWhere, addToLayerList} from "./rawLayerList";
import {registerProjections} from "./crs";
import {setGazetteerUrl} from "./searchAddress";

const originalAddLayer = PluggableMap.prototype.addLayer,
    originalRemoveLayer = PluggableMap.prototype.removeLayer;

/**
 * Sets the properties of the layer provided
 * @param {ol/Layer} layer - the layer object
 * @param {object} params - params to set on the layer, such as visibility or transparency
 * @returns {ol/Layer} returns the original layer
 */
function setLayerState (layer, params) {
    if (params.visibility) {
        layer.setVisible(typeof params.visibility === "boolean" ? params.visibility : true);
    }
    if (params.transparency) {
        layer.setOpacity(typeof params.transparency === "number" ? (100 - params.transparency) / 100 : 1);
    }

    return layer;
}

/**
 * Creates a new Layer by either adding it straight to the rawLayerList or retrieving the relevant rawLayer from provided services through getRawLayer Method.
 * @param {(string|object)} layerAttrs - md_id string (hdmk), attributes object to retrieve rawLayers by or rawLayer object providing ID and URL
 * @param {number} [limit=null] - limit of layers to add to the map, mainly to limit performance issues, no limit if not provided
 * @param {string} [url="https://geoportal-hamburg.de/lgv-config/services-internet.json"] - the URL to fetch the services from
 * @returns {Promise<ol/Layer[]>} returns the array of created and added Layers
 */
function createLayer (layerAttrs, limit = null, url = defaults.layerConf) {
    const rawLayer = typeof layerAttrs === "object" ? layerAttrs : {md_id: layerAttrs};

    return getRawLayer(rawLayer, url).then(rawLayers => {
        let layerLimit = limit || rawLayers.length;
        const layers = [];

        layerLimit = rawLayers.length < layerLimit ? rawLayers.length : layerLimit;
        for (let i = 0; i < layerLimit; i++) {
            addToLayerList(rawLayers[i]);
            const newLayer = this.addLayer(rawLayers[i].id);

            newLayer.set("name", rawLayers[i].name);
            layers.push(newLayer);
        }
        return layers;
    });
}

/**
 * Adds a layer to the map, or adds a layer to the map by id.
 * This id is looked up within the array of all known services.
 *
 * Make sure services have been loaded with a callback on createMap
 * if you request the services from the internet.
 *
 * This function is available on all ol/Map instances.
 * @param {(string|ol/Layer)} layerOrId - if of layer to add to map
 * @param {object} [params] - optional parameter object
 * @param {boolean} [params.visibility=true] - whether added layer is initially visible
 * @param {Number} [params.transparency=0] - how visible the layer is initially
 * @returns {?ol.Layer} added layer
 */
function addLayer (layerOrId, params = {visibility: true, transparency: 0}) {
    let layer, layerBuilder;

    // if parameter is id, create and add layer with masterportalAPI mechanisms
    if (typeof layerOrId === "string" && !layerOrId.includes("-")) {
        const rawLayer = getLayerWhere({id: layerOrId});

        if (!rawLayer) {
            console.error("Layer with id '" + layerOrId + "' not found. No layer added to map.");
            return null;
        }
        layerBuilder = layerBuilderMap(rawLayer.typ);
        if (!layerBuilder) {
            console.error("Layer with id '" + layerOrId + "' has unknown type '" + rawLayer.typ + "'. No layer added to map.");
            return null;
        }

        layer = layerBuilder.createLayer(rawLayer, {map: this});
        layer.set("name", rawLayer.name);
        setLayerState(layer, params);
        originalAddLayer.call(this, layer);
        return layer;
    }
    // if parameter is md_id, fetch service from HMDK and add layer
    else if (typeof layerOrId === "string" && layerOrId.includes("-")) {
        createLayer.call(this, layerOrId);
        return null;
    }

    // else use original function
    return originalAddLayer.call(this, layerOrId);
}

/**
 * Removes a layer from the map, or removes a layer from the map by id.
 * This id is looked up within the array of all layers on the specified map.
 *
 * This function is available on all ol/Map instances.
 * @param {(string|ol/Layer)} layerOrId - id or layer to remove from map
 * @returns {?ol/Layer} the removed layer
 */
function removeLayer (layerOrId) {
    let layer = layerOrId;

    if (typeof layer === "string") {
        layer = this.getLayers().getArray().find(olLayer => olLayer.get("id") === layer);
    }
    originalRemoveLayer.call(this, layer);
}

/** Replace original ol/PluggableMap methods */
PluggableMap.prototype.addLayer = addLayer;
PluggableMap.prototype.removeLayer = removeLayer;

/** Add createLayer to ol/PluggableMap methods */
PluggableMap.prototype.createLayer = createLayer;

/**
 * Creates an openlayers map according to configuration. Does not set many default values itself, but uses function that do.
 * Check the called functions for default values, or [the defaults file]{@link ./defaults.js}.
 * @param {object} [config] - configuration object - falls back to defaults if none given
 * @param {string} [config.target="map"] - div id to render map to
 * @param {string} [config.backgroundImage] - background image for map; "" to use none
 * @param {string} [config.epsg] - CRS to use
 * @param {number[]} [config.extent] - extent to use
 * @param {Array.<{resolution: number, scale: number, zoomLevel: number}>} [config.options] - zoom level definition
 * @param {Array.<string[]>} [config.options] - each sub-array has two values: projection name, and projection description
 * @param {number} [config.startResolution] - initial resolution
 * @param {number[]} [config.startCenter] - initial position
 * @param {(string|object)} [config.layerConf] - services registry or URL thereof
 * @param {string} [config.gazetteerUrl] - url of gazetteer to use in searchAddress
 * @param {object} [params={}] - parameter object
 * @param {object} [params.mapParams] - additional parameter object that is spread into the ol.Map constructor object
 * @param {function} [params.callback] - optional callback for layer list loading
 * @returns {object} map object from ol
 */
export function createMap (config = defaults, {mapParams, callback} = {}) {
    registerProjections(config.namedProjections);
    setBackgroundImage(config);
    setGazetteerUrl(config.gazetteerUrl);
    const map = new Map(Object.assign({
        target: config.target || defaults.target,
        interactions: olDefaultInteractions({altShiftDragRotate: false, pinchRotate: false}),
        controls: [],
        view: createMapView(config)
    }, mapParams));

    // extend callback to load configured initial layers
    initializeLayerList(config.layerConf, (param, error) => {
        getInitialLayers(config)
            .forEach(layer => map.addLayer(layer.id, layer));

        if (typeof callback === "function") {
            return callback(param, error);
        }

        return null;
    });

    return map;
}