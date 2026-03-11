import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';

import {createMapAndTable, createCsvDownloadCaption} from './map_table';
import {stateBoundaries} from './maplayers';
import {createPublicNavigation} from './navbar';
import {retrieveStationXML } from './datastore';
import {init} from './util';
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

createMapAndTable("#maptable", timeRange, quakeQuery, chanQuery, 1)
.then(([quakeMap, quakeTable])=> {
  const text = `Significant Earthquakes in last ${recentQuakeTimeDuration.toHuman()}. `;
  const caption = createCsvDownloadCaption(quakeTable, text);
  quakeTable.caption = caption;
  const stateBound = stateBoundaries().then(boundary=>{
    boundary.addTo(quakeMap);
    return quakeMap;
  });
  return Promise.all([quakeMap, quakeTable, stateBound]);

}).catch( err => {
  sp.util.warn(err);
});
