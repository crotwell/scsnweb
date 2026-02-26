import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import "leaflet-polar-graticule";

import {createPublicNavigation} from './navbar';
import {retrieveStationXML, retrieveQuakeML} from './datastore';
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
  <h3><a href="${import.meta.env.BASE_URL}outreach/index.html">Information for the Public</a></h3>
  <p>Recent earthquakes in South Carolina, historical seismicity and
    access to current data from the South Carolina Seismic Network.
  </p>
  <h3><a href="${import.meta.env.BASE_URL}research/index.html">Seismology Research at USC</a></h3>
  <p>Seismology research at USC, software and tools for seismology research.</p>
  <h3>Recent Earthquakes near South Carolina, in the last month</h3>

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


const oldQuakeTimeDuration = Duration.fromISO('P31D');
const timeRange = Interval.before(DateTime.utc(), oldQuakeTimeDuration);

const quakeQuery = retrieveQuakeML();
const chanQuery = retrieveStationXML();
Promise.all([ quakeQuery, chanQuery ]).then( ([qml, staxml]) => {
  console.log(`qml len: ${qml.eventList.length}`)
  createMapAndTable("#maptable", timeRange, qml.eventList, staxml);
  return [qml, staxml];
}).then( ([qml, staxml]) => {

  const historicalLayer = null; //historicEarthquakes(quakeMap, timeRange);
  const tectonicSummaryLayer = null; //tectonicSummary(quakeMap);
  const stateBoundLayer = null; //stateBoundaries(quakeMap);
  return Promise.all([qml, staxml, stateBoundLayer, tectonicSummaryLayer, historicalLayer])
    .then( () => {
      console.log("Promise  for map done")
    });
});
