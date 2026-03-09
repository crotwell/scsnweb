

import * as sp from 'seisplotjs';
import {
  basicSCMap,
  addQuakesToMap,
  addStationsToMap,
} from './maplayers';
import {Interval} from 'luxon';


export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");


export function createQuakeTable(quakes: Array<sp.quakeml.Quake>): sp.infotable.QuakeTable {
    let colDefaultLabels = sp.infotable.QuakeTable.createDefaultColumnLabels();
    colDefaultLabels.delete(sp.infotable.QUAKE_COLUMN.TIME);
    //colDefaultLabels.set(sp.infotable.QUAKE_COLUMN.EVENTID, "EventId");
    let colLabels = new Map();
    colLabels.set(sp.infotable.QUAKE_COLUMN.LOCALTIME, "Time (Eastern)");
    for (let k of colDefaultLabels.keys()) {
      colLabels.set(k, colDefaultLabels.get(k));
    }

    colLabels.delete(sp.infotable.QUAKE_COLUMN.MAGTYPE);

    let quakeTable = new sp.infotable.QuakeTable([], colLabels);
    quakeTable.timeZone = EASTERN_TIMEZONE;

    quakeTable.quakeList = quakes;
    return quakeTable;
}

export function createCsvDownloadCaption(text: string): HTMLElement {
  const spanEl = document.createElement("span");
  spanEl.innerHTML = text;
  const csvButton = document.createElement("button");
  csvButton.name="Download CSV";
  csvButton.textContent="Download CSV";
  csvButton.title="download table as csv";
  csvButton.addEventListener("click", (evt) => {
    const content = quakeTable.tableToCSV();
    console.log(content)
    const filename = "sc_earthquakes.csv";
    sp.util.downloadBlobAsFile(new TextEncoder().encode(content), filename);
  });
  spanEl.appendChild(csvButton);
  return spanEl;
}


export function createMapAndTable(divSelector: string = "map",
    timeRange: Interval,
    quakePromise: Promise<Array<sp.quakeml.Quake>>,
    staxmlPromise: Promise<Array<sp.stationxml.Network>>,
    zoomLevel=7
) {
  const outerDiv = document.querySelector(divSelector);
  if (outerDiv == null) {
    throw new Error("Can't find div for "+divSelector);
  }
  const mapDiv = document.createElement("div");
  mapDiv.id = "map";
  outerDiv.appendChild(mapDiv);
  const tableDiv = document.createElement("div");
  tableDiv.id = "table";
  outerDiv.appendChild(tableDiv);

  const quakeMap = basicSCMap(mapDiv, zoomLevel);
  let quakeTable = createQuakeTable([]);
  quakeTable.columnLabels.set("seismo", "Seismogram");
  quakeTable.columnValues.set("seismo", (q: Quake) => {
    const seismoLink = document.createElement("a");
    seismoLink.href = `${import.meta.env.BASE_URL}seismogram/index.html?eventid=${q.eventId}`;
    seismoLink.textContent = "View";
    return seismoLink;
  });
  tableDiv.appendChild(quakeTable);
  const sleepPromise = new Promise(resolve => setTimeout(resolve, 500));
  const drawQuakePromise = sleepPromise
  .then(() => {
      return quakePromise.then(quakeList=> {
      const quakesInTime = quakeList.filter(q => {
        return timeRange.start <= q.time && q.time <= timeRange.end;
      });
      quakeTable.quakeList = quakesInTime;
      addQuakesToMap(quakeMap, quakesInTime);
      return quakesInTime;
    });
  });
  const drawStationPromies = staxmlPromise.then(networkList => {
    networkList.forEach(n => addStationsToMap(quakeMap, n.stations));
    return networkList;
  })
  return Promise.all([drawQuakePromise, drawStationPromies])
  .then(()=> {
    return Promise.resolve([quakeMap, quakeTable]);
  });
}
