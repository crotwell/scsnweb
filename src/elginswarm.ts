import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime} from 'luxon';

import {createPublicNavigation} from './navbar';
import {
  basicSCMap,
  addQuakesToMap,
} from './maplayers';
import {retrieveHistoric} from './datastore';
import {createQuakeTable, createCsvDownloadCaption} from './map_table';
import {init} from './util';
init();

export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML= `
  <div>
    <p>
    There have been <span id="numquakes">0</span> earthquakes in the swarm
    near Lugoff and Elgin that started on December 27, 2021.
    </p>
  </div>
  <div id='map' width="300" height="300"></div>
  <div id='table'>
  </div>
`;

const map = basicSCMap(document.querySelector("#map")!, 11, [34.15, -80.74]);

const swarmStart = DateTime.fromISO("2021-12-27T00:00");
/*
const minlat = 34.1;
const maxlat = 34.3;
const minlon = -80.6;
const maxlon = -80.9;
*/
const minlat = 34.1;
const maxlat = 34.2;
const minlon = -80.8;
const maxlon = -80.68;
retrieveHistoric().then(quakeList => {

  console.log(`prefilter earthquakes: ${quakeList.length}`)
  return quakeList.filter(q => {
    const origin = q.preferredOrigin;

    return (origin!=null && origin.time > swarmStart &&
      minlat < origin.latitude && origin.latitude < maxlat &&
      minlon < origin.longitude && origin.longitude < maxlon);

  });
}).then(swarmQuakes => {
  document.querySelector("#numquakes")!.textContent = ""+swarmQuakes.length;
  return swarmQuakes;
}).then(swarmQuakes => {
  addQuakesToMap(map, swarmQuakes);
  console.log(`Swarm earthquakes: ${swarmQuakes.length}`);
  const quakeTable = createQuakeTable(swarmQuakes);
  quakeTable.addEventListener(sp.quakeml.QUAKE_CLICK_EVENT, (evt) => {
    if (!sp.quakeml.isQuakeClickCustomEvent(evt)) {
      throw new Error("not a QuakeClickEvent");
    }
    window.location.assign(`${import.meta.env.BASE_URL}seismogram/index.html?eventid=${evt.detail.quake.eventId}`);
  });
  const text = `Earthquakes in the Lugoff-Elgin Swarm, ${swarmStart.toLocaleString(DateTime.DATE_MED)} to present. `;
  const caption = createCsvDownloadCaption(quakeTable, text);
  quakeTable.caption = caption;
  const tableDiv = document.querySelector<HTMLDivElement>('#table')!;
  tableDiv.appendChild(quakeTable);
  quakeTable.draw();

}).catch( err => {
  sp.util.warn(err);
});
