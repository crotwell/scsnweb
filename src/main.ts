import './style.css'
import './leaflet.css'

import {DateTime, Duration, Interval} from 'luxon';

import {createMainNavigation} from './navbar';
import {retrieveStationXML, retrieveSCQuakesWeek} from './datastore';
import {createMapAndTable,
  createCsvDownloadCaption,
  quakeTableCaptionSC
} from './map_table';
import {stateBoundaries} from './maplayers';


import {init} from './util';
init();

createMainNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
<h1>Seismology at USC</h1>
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
  <h2>Recent Earthquakes near South Carolina, (1 week)</h2>

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

const recentQuakeTimeDuration = Duration.fromISO("P1W");
const timeRange = Interval.before(DateTime.utc(), recentQuakeTimeDuration);
const quakeQuery = retrieveSCQuakesWeek();
const chanQuery = retrieveStationXML();
createMapAndTable("#maptable", timeRange, quakeQuery, chanQuery)
.then(([quakeMap, quakeTable])=> {
  quakeTableCaptionSC(quakeTable, recentQuakeTimeDuration);
  console.log(`set table caption to ${caption}`)
  const stateBound = stateBoundaries().then(boundary=>{
    boundary.addTo(quakeMap);
    return quakeMap;
  });
  return Promise.all([quakeMap, quakeTable, stateBound]);
}).then(() => {
  console.log("main done map,table")
}).catch( err => {
  sp.util.warn(err);
});
