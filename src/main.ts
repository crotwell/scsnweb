import './style.css'

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
import {EASTERN_TIMEZONE, createQuakeTable} from './util';

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
  <sp-station-quake-map
    tileUrl='${BASE_TILE}'
    tileAttribution='${BASE_TILE_ATTR}'
    zoomLevel="7"
    centerLat="33.5" centerLon="-81"
    fitbounds="false">
  </sp-station-quake-map>
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


const quakeMap = document.querySelector("sp-station-quake-map") as sp.leafletutil.QuakeStationMap;
if (!quakeMap) {throw new Error("Can't find sp-station-quake-map");}

let allQuakes: Array<sp.quakeml.Quake> = [];


function displayForTime(timeRange: Interval, quakes: Array<sp.quakeml.Quake>): Array<sp.quakeml.Quake> {
  const quakesInTime = quakes.filter(q => {
    return timeRange.start <= q.time && q.time <= timeRange.end;
  });

  let quakeTable = createQuakeTable(quakesInTime);
  app.appendChild(quakeTable);
  quakeTable.draw();
  quakeMap.quakeList = []
  quakeMap.addQuake(quakesInTime);
  quakeMap.onRedraw = () => {
    addGraticule(quakeMap);
  };
  quakeMap.redraw();
  return quakes;
}

const oldQuakeTimeDuration = Duration.fromISO('P31D');
const timeRange = Interval.before(DateTime.utc(), oldQuakeTimeDuration);

const quakeQuery = retrieveQuakeML();
const chanQuery = retrieveStationXML();
Promise.all([ quakeQuery, chanQuery ]).then( ([qml, staxml]) => {
  console.log(`qml len: ${qml.eventList.length}`)

  allQuakes = qml.eventList;
  //const trEl = document.querySelector("sp-timerange");
  displayForTime(timeRange, allQuakes);

  let table = document.querySelector("sp-quake-table") as sp.infotable.QuakeTable;
  if (!table) {throw new Error("Can't find sp-quake-table");}
  console.log(`got ${qml.eventList.length} quakes ${table.quakeList.length}`)
  staxml.forEach(net=> {
    quakeMap.addStation(net.stations);
  });
  quakeMap.redraw();
  return [qml, staxml];
}).then( ([qml, staxml]) => {

  const historicalLayer = historicEarthquakes(quakeMap, timeRange);
  const tectonicSummaryLayer = null;//tectonicSummary(quakeMap);
  const stateBoundLayer = stateBoundaries(quakeMap);
  return Promise.all([qml, staxml, stateBoundLayer, tectonicSummaryLayer, historicalLayer])
    .then( () => {
      quakeMap.redraw();
      console.log("Promise  for map done")
    });
});
