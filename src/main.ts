import './style.css'
import './leaflet.css'

import {DateTime, Duration, Interval} from 'luxon';

import {createPublicNavigation} from './navbar';
import {retrieveStationXML, retrieveSCQuakesWeek} from './datastore';
import {createMapAndTable} from './map_table';

import {init} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

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
createMapAndTable("#maptable", timeRange, quakeQuery, chanQuery)
.then(() => {
  console.log("main done map,table")
});
