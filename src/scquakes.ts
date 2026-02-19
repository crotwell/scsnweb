import './style.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import "leaflet-polar-graticule";

import {createPublicNavigation} from './navbar';
import {retrieveStationXML, retrieveQuakeML} from './datastore';
import {
  addGraticule,
  historicEarthquakes, stateBoundaries
} from './maplayers';

export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

const WORLD_OCEAN = "http://www.seis.sc.edu/tilecache/WorldOceanBase/{z}/{y}/{x}"
const WORLD_OCEAN_ATTR = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'

const BASE_TILE = WORLD_OCEAN;
const BASE_TILE_ATTR = WORLD_OCEAN_ATTR;

if (true) {
app.innerHTML = `
  <h3>Recent Earthquakes near South Carolina</h3>
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

  let colDefaultLabels = sp.infotable.QuakeTable.createDefaultColumnLabels();
  colDefaultLabels.delete(sp.infotable.QUAKE_COLUMN.TIME);
  let colLabels = new Map();
  colLabels.set(sp.infotable.QUAKE_COLUMN.LOCALTIME, "Time (Eastern)");
  for (let k of colDefaultLabels.keys()) {
    colLabels.set(k, colDefaultLabels.get(k));
  }

  colLabels.delete(sp.infotable.QUAKE_COLUMN.MAGTYPE);

  let quakeTable = new sp.infotable.QuakeTable([], colLabels);
  quakeTable.timeZone = EASTERN_TIMEZONE;

  quakeTable.quakeList = quakesInTime;
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
  staxml.forEach(net=> {
    quakeMap.addStation(net.stations);
  });
  quakeMap.redraw();
  return [qml, staxml];
}).then( ([qml, staxml]) => {

  const historicalLayer = null; //historicEarthquakes(quakeMap, timeRange);
  const tectonicSummaryLayer = null; //tectonicSummary(quakeMap);
  const stateBoundLayer = null; //stateBoundaries(quakeMap);
  return Promise.all([qml, staxml, stateBoundLayer, tectonicSummaryLayer, historicalLayer])
    .then( () => {
      quakeMap.redraw();
      console.log("Promise  for map done")
    });
});
