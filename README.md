# masterportalAPI

The masterportalAPI is an API to include and show map-content on your webpage. It's based on OpenLayers and extended with functions to easily use configuration and infrastructure files from the masterportal, a feature-rich mapping app developed by geowerkstatt hamburg. Check masterportal.org for further information.

## Usage

Install the masterportalAPI in your project with ``npm install git+https://bitbucket.org/geowerkstatt-hamburg/masterportalapi.git``. The project does not have a default export, but various named exports. Generate and check the documentation as described below for details.

By importing the project by module name like ``import ... from "masterportalAPI"``, most bundlers and bundler configurations will include the whole masterportalAPI. If you only need a subset of the provided functions and want to keep your build clean, directly import the needed functions like ``import {createMap} from "masterportalAPI/src/map.js``.

### Modules

Check JSDoc

|Module|Property|Description|
|-|-|-|
|map|createMap|creates the ``ol/Map``|
||createLayer|Creates new Layers and adds them to the map, based on services.json provided, see *Defaults*|
||addLayer|inherited from ``ol/PluggableMap``|
||removeLayer|inherited from ``ol/PluggableMap``|
|mapView||see JSDoc, handles the ``ol/View``|
|crs||see JSDoc, handles the Projections/CoordinateSystems|
|layer|wms|see JSDoc, handles/creates WMS-Layers, ``ol/source/TileWMS``, ``ol/source/ImageWMS``, ``ol/layer/Tile``, ``ol/layer/Image``|
||wfs|see JSDoc, handles/creates WFS-Layers, ``ol/source/Vector``, ``ol/layer/Vector``, ``ol/format/WFS``|
||geoJson|see JSDoc, handles/creates geoJson-Layers, ``ol/source/Vector``, ``ol/layer/Vector``, ``ol/format/GeoJSON``|
||lib|see JSDoc, misc layer-methods|
|search|see JSDoc|handles address search within the application|

### Defaults

Most functions have optional parameters and rely by default on values descripted in ``src\defaults.js``. These default parameters reference services of LGV-Hamburg and Hamburg centered projection and map settings.

## Scripts

|Script|Effect|
|-|-|
|``npm run example``|Starts a dev server with a running example. Please mind that the page seen is _not_ part of the masterportalAPI, but merely an environment for manual testing. Change code within ``./example/index.js`` to try things. Free hot reloading thanks to parcel.|
|``npm run generate-jsdoc``|Generates the project documentation within the folder ``./docs``.|
|``npm test``|Runs all tests. Prints code coverage to console.|
|``npm test:watch``|Runs all tests in watch mode. Good practive to let this run during development in a separate terminal. |

## About Babel

The Babel dev dependencies are purely added for development tests and jest tests. Babel is required for testing since Node does not support ES6 in .js files so far.
