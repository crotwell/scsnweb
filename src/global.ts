import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';

import {createMapAndTable} from './map_table';

import {createPublicNavigation} from './navbar';
import {retrieveStationXML, retrieveGlobalSignificant, seismometerChannels} from './datastore';
import {
  basicSCMap,
  addQuakesToMap,
  addStationsToMap,
  historicEarthquakes, stateBoundaries,
} from './maplayers';
import {init, createQuakeTable} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

export const SELECTED_ROW = "selectedRow";
export const recentQuakeTimeDuration = Duration.fromISO('P30D');

if (true) {
app.innerHTML = `
  <h3>Recent Significant Global Earthquakes (${recentQuakeTimeDuration.toHuman()})</h3>
  <h5>as recorded in South Carolina</h5>

    <div class="showalleq show">

    <div id='maptable' "></div>
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
if (!dialog || ! closeDialogButton) {
  throw new Error("Can't find dialog");
}
closeDialogButton.addEventListener("click", () => {
  dialog.close();
});

const timeRange = Interval.before(DateTime.utc(), recentQuakeTimeDuration);

const quakeQuery = sp.usgsgeojson.loadMonthSummarySignificant();
const chanQuery = retrieveStationXML();

Promise.all([ quakeQuery, chanQuery ]).then( ([quakeList, staxml]) => {
  console.log(`qml len: ${quakeList.length}`)
  let [quakeMap, quakeTable] = createMapAndTable("#maptable", timeRange, quakeList, staxml, 1);
  quakeTable.addEventListener("quakeclick", (evt) => {
    window.location =`${import.meta.env.BASE_URL}seismogram/index.html?eventid=${evt.detail.quake.eventId}`;
  });
  return Promise.all([quakeList, staxml, quakeMap, quakeTable]);
});
