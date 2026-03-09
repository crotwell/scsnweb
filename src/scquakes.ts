import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';

import {createMapAndTable, createCsvDownloadCaption} from './map_table';
import {stateBoundaries} from './maplayers';
import {createPublicNavigation} from './navbar';
import {retrieveStationXML, retrieveQuakeML} from './datastore';
import {
  addStationsToMap,
} from './maplayers';

import {init} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

export const recentQuakeTimeDuration = Duration.fromISO('P3M');

if (true) {
app.innerHTML = `
  <h1>Recent Earthquakes near South Carolina, ${recentQuakeTimeDuration.toHuman()}</h1>

  <div id="maptable"></div>

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


const timeRange = Interval.before(DateTime.utc(), recentQuakeTimeDuration);

const quakeQuery = retrieveQuakeML().then(qml => qml.eventList);
const chanQuery = retrieveStationXML();
createMapAndTable("#maptable", timeRange, quakeQuery, chanQuery)
.then(([quakeMap, quakeTable]) => {
  const text = `Recent Earthquakes near South Carolina in last ${recentQuakeTimeDuration.toHuman()}. `;
  const caption = createCsvDownloadCaption(text);
  quakeTable.caption = caption;
  const others = new sp.fdsnstation.StationQuery();
  others.latitude(33.7).longitude(-80.7).maxRadius(2)
    .startTime(sp.util.isoToDateTime("now"))
    .channelCode("HH?,BH?,HN?");

  const stateBound = stateBoundaries().then(boundary=>{
    boundary.addTo(quakeMap);
    return quakeMap;
  });
  return Promise.all([quakeMap, quakeTable, others.queryStations(), stateBound]);
}).then(([quakeMap, quakeTable, otherstaxml, stateBound]) => {
  console.log(`otherstaxml: ${otherstaxml.length}`)
  const otherClassList = ["otherstation"];
  otherstaxml.forEach((net: sp.stationxml.Network) => {
    if (net.networkCode !== "CO") {
      addStationsToMap(quakeMap, net.stations, otherClassList);
    }
  });
  return Promise.all([quakeMap, quakeTable, otherstaxml, stateBound]);
});
