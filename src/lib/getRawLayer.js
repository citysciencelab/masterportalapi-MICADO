import defaults from "../defaults";
import makeRequest from "./makeRequest";

/**
 * Retrieves an array of rawLayer-objects from a given services-url by any set of attributes
 * Takes any kind of attribute, if "md-id" is provided it is looked up from the "dataset" property on the rawLayer
 * @todo rewrite filter function to recursively scan the rawLayer
 * @param {Object} layerConfig - the attributes (key/value) to search for in provided services.json
 * @param {String} [url="https://geoportal-hamburg.de/lgv-config/services-internet.json"] - the URL to fetch the services from
 * @returns {Promise<Object[]>} the Promise resolving the Array of rawLayers to create the ol/Layer for
 */
export default function (layerConfig, url = defaults.layerConf) {
    return makeRequest(url)
        .then(response => {
            return response.filter(service => {
                const attrCount = Object.keys(layerConfig).length;
                let matches = 0;

                for (const attr in layerConfig) {
                    if (service[attr] === layerConfig[attr]) {
                        matches += 1;
                    }
                }
                if (layerConfig.md_id) {
                    // hardcoded filter for non-vector data when looking up layers by md_id
                    if (service.datasets && service.typ === "WMS") {
                        if (service.datasets.some(set => set.md_id === layerConfig.md_id)) {
                            matches += 1;
                        }
                    }
                }
                return matches >= attrCount;
            });
        }, rejected => {
            console.error(rejected);
            return [];
        });
}