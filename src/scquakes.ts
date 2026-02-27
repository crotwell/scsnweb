import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import "leaflet-polar-graticule";

import {createMapAndTable} from './map_table';
import {createPublicNavigation} from './navbar';
import {retrieveStationXML, retrieveQuakeML} from './datastore';
import {
  addStationsToMap,
  historicEarthquakes, stateBoundaries,
} from './maplayers';
import {createQuakeTable} from './util';

import {init} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

export const recentQuakeTimeDuration = Duration.fromISO('P3M');

if (true) {
app.innerHTML = `
  <h3>Recent Earthquakes near South Carolina, ${recentQuakeTimeDuration.toHuman()}</h3>

  <div id='maptable' "></div>

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

const quakeQuery = retrieveQuakeML();
const chanQuery = retrieveStationXML();

Promise.all([ quakeQuery, chanQuery ]).then( ([qml, staxml]) => {
  console.log(`qml len: ${qml.eventList.length}`)
  let [quakeMap, quakeTable] = createMapAndTable("#maptable", timeRange, qml.eventList, staxml);
  return Promise.all([qml, staxml, quakeMap, quakeTable]);
}).then(([qml, staxml, quakeMap, quakeTable])=> {
  const others = new sp.fdsnstation.StationQuery();
  others.latitude(33.7).longitude(-80.7).maxRadius(2)
    .startTime(sp.util.isoToDateTime("now"))
    .channelCode("HH?,BH?,HN?");
  return Promise.all([qml, staxml, quakeMap, quakeTable, others.queryStations()]);
}).then(([qml, staxml, quakeMap, quakeTable, otherstaxml]) => {
  console.log(`otherstaxml: ${otherstaxml.length}`)
  const otherClassList = ["otherstation"];
  otherstaxml.forEach(net=> {
    if (net.networkCode !== "CO") {
      const markerList = addStationsToMap(quakeMap, net.stations, otherClassList);
    }
  });
});
