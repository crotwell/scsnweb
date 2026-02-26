

import * as sp from 'seisplotjs';
import {
  basicSCMap,
  addQuakesToMap,
  addStationsToMap,
  historicEarthquakes, stateBoundaries,
  WORLD_OCEAN, WORLD_OCEAN_ATTR
} from './maplayers';
import {createQuakeTable} from './util';


export function createMapAndTable(divSelector: string = "map",
    timeRange: Interval,
    quakeList: Array<sp.quakeml.Quake>,
    networkList: Array<s.stationxml.Network>,
) {
  const outerDiv = document.querySelector(divSelector);
  outerDiv.innerHTML = `
    <div id="map"></div>
    <div id="table"></div>

  `;

  const quakeMap = basicSCMap(outerDiv.querySelector("#map"), 7);
  const quakesInTime = quakeList.filter(q => {
    return timeRange.start <= q.time && q.time <= timeRange.end;
  });
  let quakeTable = createQuakeTable(quakesInTime);
  outerDiv.querySelector("#table").appendChild(quakeTable);
  quakeTable.draw();
  addQuakesToMap(quakeMap, quakesInTime);
  networkList.forEach(n => addStationsToMap(quakeMap, n.stations));
  return [quakeMap, quakeTable];
}
