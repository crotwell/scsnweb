import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import "leaflet-polar-graticule";

import {createPublicNavigation} from './navbar';
import {
  basicSCMap,
  addQuakesToMap,
  addStationsToMap,
  historicEarthquakes, stateBoundaries,
  WORLD_OCEAN, WORLD_OCEAN_ATTR,
  HISTORIC_URL, ANCIENT_URL
} from './maplayers';
import {init, EASTERN_TIMEZONE} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

const BASE_TILE = WORLD_OCEAN;
const BASE_TILE_ATTR = WORLD_OCEAN_ATTR;

if (true) {
app.innerHTML = `
  <div id='map' width="300" height="300"></div>
  <div id='table'>
  </div>
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



const quakeMap = basicSCMap(document.querySelector("#map"), 7);

const hist_style = {
  color: "black",
  weight: 0.75,
  fillColor: "white"
};
historicEarthquakes(null, hist_style).then(historicalLayer => historicalLayer.addTo(quakeMap));

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
  if (table) {table.quakeList = quakeList;}
  table.addEventListener("quakeclick", (evt) => {
    window.location =`${import.meta.env.BASE_URL}seismogram/index.html?eventid=${evt.detail.quake.eventId}`;
  });
}).catch( e => {
  console.log(e);
});
