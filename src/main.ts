import './style.css'
import scLogo from '/usc_logo_horizontal_rgb_g_rev.svg'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import * as L from 'leaflet';
import "leaflet-polar-graticule";

import {createNavigation} from './navbar';
import {retrieveStationXML, retrieveQuakeML} from './datastore';
import {
  addGraticule,
  historicEarthquakes, stateBoundaries, tectonicSummary
} from './maplayers';

export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

const NAT_GEO = "http://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}"
const NAT_GEO_ATTR = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
const WORLD_TOPO = "http://www.seis.sc.edu/tilecache/USGSTopo/{z}/{y}/{x}"
const WORLD_TOPO_ATTR = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
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
closeDialogButton.addEventListener("click", () => {
  dialog.close();
});


const quakeMap = document.querySelector("sp-station-quake-map");

let allQuakes = [];


function displayForTime(timeRange: Interval, quakes: Array<Quake>): Array<Quake> {
  const quakesInTime = allQuakes.filter(q => {
    return timeRange.start <= q.time && q.time <= timeRange.end;
  });
  const oldQuakes = allQuakes.filter(q => {
    return q.time < timeRange.start;
  });

  let quakeMap = document.querySelector("sp-station-quake-map");

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
  quakeMap.onRedraw = (eqMap) => {
    addGraticule(eqMap);
  };
  quakeMap.redraw();
}

const oldQuakeTimeDuration = Duration.fromISO('P1Y');
const timeRange = Interval.before(DateTime.utc(), oldQuakeTimeDuration);

const quakeQuery = retrieveQuakeML();
const chanQuery = retrieveStationXML();
Promise.all([ quakeQuery, chanQuery ]).then( ([qml, staxml]) => {
  console.log(`qml len: ${qml.eventList.length}`)

  allQuakes = qml.eventList;
  //const trEl = document.querySelector("sp-timerange");
  displayForTime(timeRange, allQuakes);

  let table = document.querySelector("sp-quake-table");
  console.log(`got ${qml.eventList.length} quakes ${table.quakeList.length}`)
  const map = document.querySelector("sp-station-quake-map");
  staxml.forEach(net=> {
    map.addStation(net.stations);
  });
  map.redraw();
  return [qml, staxml];
}).then( ([qml, staxml]) => {

  const historicalLayer = historicEarthquakes(quakeMap, timeRange);
  const tectonicLayer = tectonicSummary(quakeMap);
  const stateBoundLayer = stateBoundaries(quakeMap);
  return Promise.all([qml, staxml, stateBoundLayer, tectonicLayer, historicalLayer])
    .then( () => {
      const map = document.querySelector("sp-station-quake-map");
      map.redraw();
      console.log("Promise  for map done")
    });
});
