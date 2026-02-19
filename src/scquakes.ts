import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import "leaflet-polar-graticule";

import {createPublicNavigation} from './navbar';
import {retrieveStationXML, retrieveQuakeML} from './datastore';
import {
  basicSCMap,
  addQuakesToMap,
  addStationsToMap,
  addGraticule,
  historicEarthquakes, stateBoundaries,
  WORLD_OCEAN, WORLD_OCEAN_ATTR
} from './maplayers';
import {createQuakeTable} from './util';



createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

const BASE_TILE = WORLD_OCEAN;
const BASE_TILE_ATTR = WORLD_OCEAN_ATTR;

if (true) {
app.innerHTML = `
  <h3>Recent Earthquakes near South Carolina</h3>

  <div id='map' width="300" height="300"></div>
  <div id='table'>
  </div>
  <h5>Below map</h5>

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

let allQuakes: Array<sp.quakeml.Quake> = [];


function displayForTime(timeRange: Interval, quakes: Array<sp.quakeml.Quake>): Array<sp.quakeml.Quake> {
  const quakesInTime = quakes.filter(q => {
    return timeRange.start <= q.time && q.time <= timeRange.end;
  });
  const quakeTable = createQuakeTable(quakesInTime);
  const tableDiv = document.querySelector<HTMLDivElement>('#table')!;
  tableDiv.appendChild(quakeTable);
  quakeTable.draw();

  addQuakesToMap(quakeMap, quakesInTime);
  return quakes;
}

const oldQuakeTimeDuration = Duration.fromISO('P90D');
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
  let stationList = []
  staxml.forEach(net=> {
    stationList = stationList.concat(net.stations);
  });
  addStationsToMap(quakeMap, stationList);
  return [qml, staxml];
}).then( ([qml, staxml]) => {

  const historicalLayer = null; //historicEarthquakes(quakeMap, timeRange);
  const tectonicSummaryLayer = null; //tectonicSummary(quakeMap);
  const stateBoundLayer = stateBoundaries();
  return Promise.all([qml, staxml, stateBoundLayer, tectonicSummaryLayer, historicalLayer])
    .then( ([qml, staxml, stateBoundLayer, tectonicSummaryLayer, historicalLayer]) => {
      stateBoundLayer.addTo(quakeMap);
      console.log("Promise  for map done")
    });
});
