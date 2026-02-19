import './style.css'

import * as sp from 'seisplotjs';
import "leaflet-polar-graticule";

import {createPublicNavigation} from './navbar';
import {
  addGraticule,
  historicEarthquakes, stateBoundaries
} from './maplayers';
import {init} from './util';
init();

export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

export const WORLD_OCEAN = "http://www.seis.sc.edu/tilecache/WorldOceanBase/{z}/{y}/{x}"
export const WORLD_OCEAN_ATTR = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'

const BASE_TILE = WORLD_OCEAN;
const BASE_TILE_ATTR = WORLD_OCEAN_ATTR;

if (true) {
app.innerHTML = `
  <sp-station-quake-map
    class="large"
    tileUrl='${BASE_TILE}'
    tileAttribution='${BASE_TILE_ATTR}'
    zoomLevel="7"
    centerLat="33.5" centerLon="-81"
    fitbounds="false">
  </sp-station-quake-map>
  <sp-quake-table>
  </sp-quake-table>
  <dialog>
    <div>
    </div>
    <button autofocus>Close</button>
  </dialog>
`
}

const dialog = document.querySelector("dialog");
const closeDialogButton = document.querySelector("dialog button");
if (!dialog || !closeDialogButton) {throw new Error("Can't find dialog");}
closeDialogButton.addEventListener("click", () => {
  dialog.close();
});


const quakeMap = document.querySelector("sp-station-quake-map") as sp.leafletutil.QuakeStationMap;
if (!quakeMap) {throw new Error("Can't find sp-station-quake-map");}

const hist_style = {
  color: "black",
  weight: 0.75,
  fillColor: "white"
};
const historicalLayer = historicEarthquakes(quakeMap, null, hist_style);

quakeMap.onRedraw = () => {
  addGraticule(quakeMap);
};

const stateBoundLayer = stateBoundaries(quakeMap);
Promise.all([historicalLayer, stateBoundLayer]).then(()=> {
  quakeMap.redraw();
});

const eqUrls = [
  ANCIENT_URL,
  HISTORIC_URL
];
Promise.all(eqUrls.map( url => {
  return sp.usgsgeojson.loadUSGSGeoJsonSummary(url)
    .then( qml => {
      return qml.eventList.filter(q => {
          return q?.magnitude && q.magnitude.mag > 3;
        });
      });
    })
).then((qmlList) => {
  let quakeList = [];
  qmlList.forEach( qmlEvents => quakeList = quakeList.concat(qmlEvents));
  return quakeList;
}).then(quakeList => {
  let table = document.querySelector("sp-quake-table");
  table.quakeList = quakeList;
}).catch( e => {
  console.log(e);
});
