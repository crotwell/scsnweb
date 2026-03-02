

import * as sp from 'seisplotjs';
import {
  basicSCMap,
  addQuakesToMap,
  addStationsToMap,
} from './maplayers';
import {createQuakeTable} from './util';
import {Interval} from 'luxon';


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
  quakeTable.addEventListener(sp.quakeml.QUAKE_CLICK_EVENT, ((evt: Event) => {
    if (!sp.quakeml.isQuakeClickCustomEvent(evt)) {
      throw new Error("not a QuakeClickEvent");
    }
    window.location.assign(`${import.meta.env.BASE_URL}seismogram/index.html?eventid=${evt.detail.quake.eventId}`);
  }) as EventListener);
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
