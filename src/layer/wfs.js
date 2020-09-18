import {Vector as VectorLayer} from "ol/layer.js";
import {Vector as VectorSource} from "ol/source.js";
import WFS from "ol/format/WFS";
import style, {setCustomStyles} from "./style";

// forward import to export
export {setCustomStyles};

/**
 * onAddFeature function for source that ensures a feature has an id.
 * If feature has no id, the ol_uid is set to feature.id.
 * @param {object} param - parameter object
 * @param {ol.Feature} param.feature - openlayers feature added to source
 * @returns {undefined}
 * @ignore
 */
function onAddFeature ({feature}) {
    if (typeof feature.getId() === "undefined") {
        feature.setId(feature.ol_uid);
    }
}

/**
 * Creates the VectorSource for a WFS layer. It will ensure each feature has the field id set to use with the other exported geojson functions.
 * @param {object} rawLayer - rawLayer as specified in services.json
 * @param {object} [options={}] - optional additional query parameters, check WFSv1.1.0 documentation
 * @param {ol.Feature[]} [featuresToAdd=[]] - optional features to add to the layer
 * @param {string} [wfsVersion="1.1.0"] - optional WFS-Version, if not 1.1.0 is used
 * @returns {ol.source.Vector} created VectorSource
 */
export function createLayerSource (rawLayer, options = {}, featuresToAdd = [], wfsVersion = "1.1.0") {
    rawLayer.url = rawLayer.url ? rawLayer.url : "";
    rawLayer.featureType = rawLayer.featureType ? rawLayer.featureType : "";

    const url = `${rawLayer.url}?service=WFS&version=${wfsVersion}&request=GetFeature&typename=${rawLayer.featureType}`,
        parser = new WFS(),
        source = new VectorSource();

    for (const key in options) {
        const option = Array.isArray(options[key]) ? options[key].join(",") : options[key];

        url += `&${key}=${option}`;
    }

    fetch(url)
        .then(response => response.text())
        .then(responseString => parser.readFeatures(responseString))
        .then(features => {
            source.addFeatures([...features, ...featuresToAdd]);
        });

    source.on("addfeature", onAddFeature);

    return source;
}

/**
 * Creates a layer from WFS.
 * @param {object} rawLayer - rawLayer as specified in services.json
 * @param {object} [param={}] - parameter object
 * @param {ol.Style} [param.layerStyle] - optional style; if not given, default styling (modifiable by setCustomStyles) is used
 * @param {object} [options={}] - optional additional query parameters, check WFSv1.1.0 documentation
 * @param {ol.Feature[]} [features=[]] - optional features to add to the layer
 * @returns {ol.layer.Vector} Layer with id and source specified in rawLayer
 */
export function createLayer (rawLayer, {layerStyle} = {}, options = {}, features = []) {
    return new VectorLayer({
        id: rawLayer.id,
        source: createLayerSource(rawLayer, options, features),
        style: layerStyle || style
    });
}

/**
 * WFS layer with an URL will be reloaded. All other layers will be cleared.
 * @param {ol.layer.Vector} layer - GeoJSON layer to update
 * @returns {undefined}
 */
export function updateSource (layer) {
    // openlayers named this "clear", but it also means "reload" if an URL is set
    layer.getSource().clear();
}

/**
 * Sets a style to all given features.
 * @param {ol.Feature[]} features - openlayers features to be styled
 * @param {ol.style.Style~StyleLike} featureStyle - style, array of styles, or style function
 * @returns {undefined}
 */
export function setFeatureStyle (features, featureStyle) {
    features.forEach(feature => feature.setStyle(featureStyle));
}

/**
 * @param {ol.Layer} layer - layer to hide all features of
 * @returns {undefined}
 */
export function hideAllFeatures (layer) {
    // () => null is the "do not display" function for openlayers (overriding VectorLayer styles)
    setFeatureStyle(layer.getSource().getFeatures(), () => null);
}

/**
 * @param {ol.Layer} layer - layer to show all features of
 * @returns {undefined}
 */
export function showAllFeatures (layer) {
    // if feature has undefined style, openlayers will check containing VectorLayer for styles
    setFeatureStyle(layer.getSource().getFeatures(), undefined);
}

/**
 * @param {ol.Layer} layer - layer to show some features of
 * @param {string[]} featureIdList - list of feature.id to show
 * @returns {undefined}
 */
export function showFeaturesById (layer, featureIdList) {
    const features = layer
        .getSource()
        .getFeatures()
        .filter(feature => featureIdList.indexOf(feature.getId()) >= 0);

    hideAllFeatures(layer);
    setFeatureStyle(features, undefined);
}
