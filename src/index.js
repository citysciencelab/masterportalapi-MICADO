import {createMap} from "./map";
import {createMapView} from "./mapView";
import * as crs from "./crs";
import * as rawLayerList from "./rawLayerList";
import * as wms from "./layer/wms";
import * as geojson from "./layer/geojson";
import * as wfs from "./layer/wfs";
import * as layerLib from "./layer/lib";
import {search, setGazetteerUrl} from "./searchAddress";
import setBackgroundImage from "./lib/setBackgroundImage";
import defaults from "./defaults";

export {
    createMap,
    createMapView,
    wms,
    wfs,
    geojson,
    layerLib,
    setBackgroundImage,
    setGazetteerUrl,
    rawLayerList,
    search,
    crs,
    defaults
};
