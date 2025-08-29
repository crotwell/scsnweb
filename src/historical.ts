import './style.css'
import scLogo from '/usc_logo_horizontal_rgb_g_rev.svg'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import * as L from 'leaflet';
import "leaflet-polar-graticule";

import {createNavigation} from './navbar';
import {retrieveStationXML, retrieveQuakeML} from './datastore';
import {
  addGraticule,
  historicEarthquakes, stateBoundaries, tectonicSummary,
  HATCHER_SC_GEOL, HISTORIC_URL
} from './maplayers';

export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

const NAT_GEO = "http://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}"
const NAT_GEO_ATTR = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
const WORLD_TOPO = "http://www.seis.sc.edu/tilecache/USGSTopo/{z}/{y}/{x}"
const WORLD_TOPO_ATTR = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
const WORLD_OCEAN = "http://www.seis.sc.edu/tilecache/WorldOceanBase/{z}/{y}/{x}"
const WORLD_OCEAN_ATTR = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'

const HATCHER_SC_GEOL_ATTR = "Hatcher and Bream"
const BASE_TILE = WORLD_OCEAN;
const BASE_TILE_ATTR = WORLD_OCEAN_ATTR;

if (true) {
app.innerHTML = `
  <h3>Historical Earthquakes near South Carolina, </h3>
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
closeDialogButton.addEventListener("click", () => {
  dialog.close();
});


const quakeMap = document.querySelector("sp-station-quake-map");
const hist_style = {
  color: "black",
  weight: 0.75,
  fillColor: "white"
};
const historicalLayer = historicEarthquakes(quakeMap, null, hist_style);

quakeMap.onRedraw = (eqMap) => {
  addGraticule(eqMap);
};

const stateBoundLayer = stateBoundaries(quakeMap);
Promise.all([historicalLayer, stateBoundLayer]).then(()=> {
  quakeMap.redraw();
});


sp.usgsgeojson.loadUSGSGeoJsonSummary(HISTORIC_URL).then( qml => {
    return qml.eventList.filter(q => {
        console.log(`mag check ${q.magnitude}`)
        return q?.magnitude && q.magnitude.mag > 3;
      });
  }).then(quakeList => {
    let table = document.querySelector("sp-quake-table");
    table.quakeList = quakeList;
  }).catch( e => {
    console.log(e);
  });
