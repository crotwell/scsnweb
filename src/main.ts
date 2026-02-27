import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import "leaflet-polar-graticule";

import {createPublicNavigation} from './navbar';
import {retrieveStationXML, retrieveSCQuakesWeek} from './datastore';
import {
  addGraticule,
  historicEarthquakes, stateBoundaries,
  WORLD_OCEAN, WORLD_OCEAN_ATTR
} from './maplayers';
import {createMapAndTable} from './map_table';
import {EASTERN_TIMEZONE, createQuakeTable} from './util';

import {init} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

const BASE_TILE = WORLD_OCEAN;
const BASE_TILE_ATTR = WORLD_OCEAN_ATTR;

if (true) {
app.innerHTML = `
<div class="publicresearch">
  <div>
    <a class="bigbutton" href="${import.meta.env.BASE_URL}outreach/index.html">Information for the Public</a>
    <p>Recent earthquakes in South Carolina, historical seismicity and
      access to current data from the South Carolina Seismic Network.
    </p>
  </div>
  <div>
    <a class="bigbutton" href="${import.meta.env.BASE_URL}research/index.html">Seismology Research at USC</a>
    <p>Seismology research at USC, software and tools for seismology research.</p>
  </div>
</div>
  <h3>Recent Earthquakes near South Carolina, (1 week)</h3>

    <div id='maptable' ></div>
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


const timeRange = Interval.before(DateTime.utc(), Duration.fromISO("P1W"));

const quakeQuery = retrieveSCQuakesWeek();
const chanQuery = retrieveStationXML();
Promise.all([ quakeQuery, chanQuery ]).then( ([quakeList, staxml]) => {
  console.log(`main qml len: ${quakeList.length}`)
  let [map, table] = createMapAndTable("#maptable", timeRange, quakeList, staxml);
  table.addEventListener("quakeclick", (evt) => {
    window.location =`${import.meta.env.BASE_URL}seismogram/index.html?eventid=${evt.detail.quake.eventId}`;
  });
  return [quakeList, staxml];
}).then( ([quakeList, staxml]) => {

  const historicalLayer = null; //historicEarthquakes(quakeMap, timeRange);
  const tectonicSummaryLayer = null; //tectonicSummary(quakeMap);
  const stateBoundLayer = null; //stateBoundaries(quakeMap);
  return Promise.all([quakeList, staxml, stateBoundLayer, tectonicSummaryLayer, historicalLayer])
    .then( () => {
      console.log("Promise  for map done")
    });
});
