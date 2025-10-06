import './style.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import "leaflet-polar-graticule";

import {createNavigation} from './navbar';
import {retrieveStationXML, retrieveGlobalSignificant, seismometerChannels} from './datastore';
import {
  addGraticule,
} from './maplayers';
import {init} from './util';
init();

export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");
export const UTC_TIMEZONE = sp.luxon.FixedOffsetZone.utcInstance;

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

const WORLD_OCEAN = "http://www.seis.sc.edu/tilecache/WorldOceanBase/{z}/{y}/{x}"
const WORLD_OCEAN_ATTR = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'

const BASE_TILE = WORLD_OCEAN;
const BASE_TILE_ATTR = WORLD_OCEAN_ATTR;


export const SELECTED_ROW = "selectedRow";

if (true) {
app.innerHTML = `
  <h3>Recent Significant Global Earthquakes</h3>
  <h5>as recorded in South Carolina</h5>

    <div class="showalleq show">
  <sp-station-quake-map
    tileUrl='${BASE_TILE}'
    tileAttribution='${BASE_TILE_ATTR}'
    zoomLevel="1"
    centerLat="33.5" centerLon="-81"
    fitbounds="false">
  </sp-station-quake-map>
  </div>
  <div class="showquake hide">
    <button id="backToAllBtn">Back</button>
    <div class="loadingmessage hide">Loading data...</div>
    <sp-organized-display
      sort="distance"
      tileUrl='${BASE_TILE}'
      tileAttribution='${BASE_TILE_ATTR}'>
    </sp-organized-display>
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

function getQuakeMap(): sp.leafletutil.QuakeStationMap {
  const quakeMap = document.querySelector("sp-station-quake-map");
  if (!quakeMap || ! (quakeMap instanceof sp.leafletutil.QuakeStationMap)) {
    throw new Error("Can't find quake map");
  }
  return quakeMap;
}

let allQuakes: Array<sp.quakeml.Quake> = [];
let inventory: Array<sp.stationxml.Network> = [];
const backBtn = document.querySelector("#backToAllBtn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    displayAllQuakes();
  });
} else {
  throw new Error("Can't find back button");
}


function displayForTime(timeRange: Interval, quakes: Array<sp.quakeml.Quake>): Array<sp.quakeml.Quake> {
  const quakesInTime = quakes.filter(q => {
    return timeRange.start <= q.time && q.time <= timeRange.end;
  });

  let colDefaultLabels = sp.infotable.QuakeTable.createDefaultColumnLabels();
  //colDefaultLabels.delete(sp.infotable.QUAKE_COLUMN.TIME);
  let colLabels = new Map();
  //colLabels.set(sp.infotable.QUAKE_COLUMN.LOCALTIME, "Time (Eastern)");
  for (let k of colDefaultLabels.keys()) {
    colLabels.set(k, colDefaultLabels.get(k));
  }

  colLabels.delete(sp.infotable.QUAKE_COLUMN.MAGTYPE);

  let quakeTable = new sp.infotable.QuakeTable([], colLabels);
  //quakeTable.timeZone = EASTERN_TIMEZONE;
  quakeTable.timeZone = UTC_TIMEZONE;

  quakeTable.addStyle(`
        td {
          padding-left: 5px;
          padding-right: 5px;
        }
        table tbody tr.${SELECTED_ROW} td {
          background-color: green;
          color: white;
        }
      `);
  quakeTable.addEventListener("quakeclick", ce => {
    if (ce instanceof CustomEvent && ce.detail?.quake) {
      console.log(`quakeclick: ${ce.detail.quake}`);
      displayQuake(ce.detail.quake);
    }
  });

  quakeTable.quakeList = quakesInTime;
  const showAllEq = document.querySelector("div.showalleq");
  if (showAllEq) {showAllEq.appendChild(quakeTable);}
  quakeTable.draw();
  const quakeMap = getQuakeMap();
  quakeMap.quakeList = []
  quakeMap.addQuake(quakesInTime);
  quakeMap.onRedraw = () => {
    addGraticule(quakeMap);
  };
  quakeMap.redraw();
  return quakes;
}

const oldQuakeTimeDuration = Duration.fromISO('P1Y');
const timeRange = Interval.before(DateTime.utc(), oldQuakeTimeDuration);

const quakeQuery = retrieveGlobalSignificant();
const chanQuery = retrieveStationXML();
Promise.all([ quakeQuery, chanQuery ]).then( ([qml, staxml]) => {
  console.log(`quake len: ${qml.eventList.length}`)

  allQuakes = qml.eventList;
  inventory = seismometerChannels(staxml);

  //const trEl = document.querySelector("sp-timerange");
  displayForTime(timeRange, allQuakes);

  let table = document.querySelector("sp-quake-table") as sp.infotable.QuakeTable;
  console.log(`got ${qml.eventList.length} quakes ${table?.quakeList.length}`);
  const quakeMap = getQuakeMap();
  staxml.forEach(net=> {
    quakeMap.addStation(net.stations);
  });
  quakeMap.redraw();
  return [qml, staxml];
});


function displayAllQuakes() {
  document.querySelectorAll(".showquake").forEach( el => {
    el.classList.remove("show");
    el.classList.add("hide");
  });
  document.querySelectorAll(".showalleq").forEach( el => {
    el.classList.remove("hide");
    el.classList.add("show");
  });
}

function displayQuake(quake: sp.quakeml.Quake) {
  if ( quake == null) {
    displayAllQuakes();
    return;
  }
  document.querySelectorAll(".loadingmessage").forEach(el => el.classList.replace("hide", "show"));
  document.querySelectorAll(".showquake").forEach( el => {
    el.classList.remove("hide");
    el.classList.add("show");
  });
  document.querySelectorAll(".showalleq").forEach( el => {
    el.classList.remove("show");
    el.classList.add("hide");
  });

  let loader = new sp.seismogramloader.SeismogramLoader(
    inventory,
    [quake]);
  loader.dataselectQuery = new sp.fdsndataselect.DataSelectQuery("eeyore.seis.sc.edu");
  //loader.dataselectQuery.port(8080)
  loader.endOffset = Duration.fromObject({minutes: 90});
  loader.startPhaseList = "origin";
  loader.markedPhaseList = "ttbasic";
  loader.startOffset = Duration.fromObject({minutes: -5});
  let allChans = Array.from(sp.stationxml.activeChannels(inventory));
  console.log(`all chans: ${allChans.length}`)
  for(const c of allChans) {
    console.log(`${c.sourceId}`)
  }
  return loader.load().then( ds => {
    console.log(`loader ${ds.waveforms.length} seismograms`);
    ds.waveforms.forEach(sdd => {
console.log(sdd)
      sdd.quakeList.forEach( quake => {
        if (quake.preferredOrigin && sdd.channel) {
          const pickMarkers = sp.seismograph.createMarkerForPicks(
            quake.preferredOrigin, sdd.channel);
          sdd.addMarkers(pickMarkers);
          sdd.alignmentTime = quake.time;
        }
      });
    });

    ds.processedWaveforms = ds.waveforms.map(sdd => {
      if (sdd.seismogram == null) {
        return sdd;
      }
      let out = sdd;
      //out = sdd.cloneWithNewSeismogram(sp.filter.rMean(sdd.seismogram));
      //out = sdd.cloneWithNewSeismogram(sp.filter.removeTrend(sdd.seismogram));
      //const highPass = sp.filter.createButterworth(2, sp.filter.BAND_PASS, 1.0, 20.0, sdd.seismogram.samplePeriod);
      //out = sdd.cloneWithNewSeismogram(sp.filter.applyFilter(highPass, out.seismogram));
      return out;
    });

    let orgDisp = document.querySelector("sp-organized-display") as sp.organizeddisplay.OrganizedDisplay;
    if (orgDisp) {
      orgDisp.seismographConfig.doGain = true;
      orgDisp.seismographConfig.ySublabelIsUnits = true;
      orgDisp.seisData = ds.processedWaveforms;
    } else {
      throw new Error("Can't find sp-organized-display element");
    }
    return ds;
  }).then( () => {
    document.querySelectorAll(".loadingmessage").forEach(el => el.classList.replace("show", "hide"));
  });
}
