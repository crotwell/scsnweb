
import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import "leaflet-polar-graticule";

import {createMapAndTable} from './map_table';
import {createPublicNavigation} from './navbar';
import {retrieveStationXML, retrieveQuakeML, quakeById} from './datastore';
import {
  addStationsToMap,
  historicEarthquakes, stateBoundaries,
} from './maplayers';
import {createQuakeTable} from './util';

import {init} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!


if (true) {
app.innerHTML = `
  <h3>Seismograms recorded in South Carolina <span id="quakeinfo"></span></h3>

  <div id="seismo">
    <sp-organized-display sort="distance">
    </sp-organized-display>
  </div>

  <dialog>
    <div>
    </div>
    <button autofocus>Close</button>
  </dialog>
`
}

const recentQuakeTimeDuration = Duration.fromISO('PT300S');

const dialog = document.querySelector("dialog");
const closeDialogButton = document.querySelector("dialog button");
if (!dialog || !closeDialogButton) {throw new Error("Can't find dialog");}
closeDialogButton.addEventListener("click", () => {
  dialog.close();
});

const parsedURL = new URL(document.URL);
const eventid = parsedURL.searchParams.get("eventid");

Promise.all([quakeById(eventid), retrieveStationXML()])
  .then(([quake, staxml]) => {
    document.querySelector('#quakeinfo').textContent =
      `for ${quake.time} (${quake.latitude}, ${quake.longitude}) Mag: ${quake.magnitude.mag} Depth: ${quake.depth} m`
    const filteredStaxml = [];
    staxml.forEach( net => {
      filteredStaxml.push(net);
      net.stations.forEach(sta => {
        sta.channels = sta.channels.filter(c => c.channelCode[0]==='H' && c.channelCode[2]==='Z');
        if (sta.channels.length>1) {
          sta.channels = sta.channels.filter(c => c.channelCode[1]==='H');
        }
      });
    });
    const loader = new sp.seismogramloader.SeismogramLoader(filteredStaxml, [quake]);
    if (sp.distaz.distaz(quake.latitude, quake.longitude, 34, -81).distanceDeg>2) {
      // not a SC event, better time params
      loader.endOffsetSeconds(600);
      loader.markedPhaseList=["PP", "SS", "PKP"];
    }
    return loader.load();
  }).then((dataset: sp.dataset.Datset) => {
    const quake = dataset.catalog[0];
    if (sp.distaz.distaz(quake.latitude, quake.longitude, 34, -81).distanceDeg>2) {
      // not a SC event, better time params
    } else {
      dataset.waveforms.forEach( sdd => {sdd.alignmentTime = quake.time;});
    }
    document.querySelector(sp.organizeddisplay.ORG_DISPLAY).seisData = dataset.waveforms;
  });
