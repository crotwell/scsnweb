
import './style.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration} from 'luxon';

import {createPublicNavigation} from './navbar';
import {retrieveStationXML, quakeById} from './datastore';
import {CENTER_SC_LAT, CENTER_SC_LON} from './maplayers';

import {init} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!


if (true) {
app.innerHTML = `
  <h1>Seismograms recorded in South Carolina <span id="quakeinfo"></span></h1>

  <div id="seismo">
    <sp-organized-display sort="distance" map="true"
    centerLat=${CENTER_SC_LAT}, centerLon=${CENTER_SC_LON},
    zoomLevel="7" maxZoom="16" >
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
if (!dialog || !closeDialogButton) {throw new Error("Can't find dialog");}
closeDialogButton.addEventListener("click", () => {
  dialog.close();
});

const parsedURL = new URL(document.URL);
const eventid = parsedURL.searchParams.get("eventid");
if (eventid != null ) {
  displayForQuake(eventid);
} else {
  let netCode = parsedURL.searchParams.get("net");
  let staCode = parsedURL.searchParams.get("sta");
  const time = parsedURL.searchParams.get("time");
  let duration = parsedURL.searchParams.get("dur");
  if (duration == null) {
    duration = "PT5M";
  }
  if (time != null && netCode != null && staCode != null) {
    displayForTime(netCode, staCode, DateTime.fromISO(time), Duration.fromISO(duration))
  } else {
    throw new Error(`Can't find quake or time,net,sta in ${document.URL}`);
  }
}

function displayForQuake(eventid: string) {
  const latlonF = new Intl.NumberFormat(navigator.language,
    { maximumFractionDigits: 2 });
    const depthF = new Intl.NumberFormat(navigator.language,
      { maximumFractionDigits: 2,
        style: "unit",
        unit: "kilometer",
        unitDisplay: "short"
       });
  return Promise.all([quakeById(eventid), retrieveStationXML()])
    .then(([quake, staxml]) => {
      if (quake == null) {
        throw new Error("Can't find quake");
      }
      const quakeInfo = document.querySelector('#quakeinfo');
      if (quakeInfo!=null) {
        quakeInfo.textContent =
        `for ${quake.time.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)} (${latlonF.format(quake.latitude)}, ${latlonF.format(quake.longitude)}) Mag: ${quake.magnitude.mag} Depth: ${depthF.format(quake.depth/1000)}`;
      }
      const filteredStaxml: Array<sp.stationxml.Network> = channelsH_Z(staxml);
      const loader = new sp.seismogramloader.SeismogramLoader(filteredStaxml, [quake]);
      if (sp.distaz.distaz(quake.latitude, quake.longitude, 34, -81).distanceDeg>2) {
        // not a SC event, better time params
        loader.endOffsetSeconds(600);
        loader.markedPhaseList=["pP", "PP", "SS", "PKP"];
      }
      return loader.load();
    }).then((dataset: sp.dataset.Dataset) => {
      const quake = dataset.catalog[0];
      if (sp.distaz.distaz(quake.latitude, quake.longitude, 34, -81).distanceDeg>2) {
        // not a SC event, better time params
      } else {
        dataset.waveforms.forEach( sdd => {sdd.alignmentTime = quake.time;});
      }
       const orgdisp = document.querySelector(sp.organizeddisplay.ORG_DISPLAY) as sp.organizeddisplay.OrganizedDisplay;
       orgdisp.seisData = dataset.waveforms;
     }).catch( err => {
       sp.util.warn(err);
       throw err;
     });
}

function displayForTime(netCode: string, staCode: string, time: DateTime, duration: Duration) {
  const quakeInfo = document.querySelector('#quakeinfo');
  if (quakeInfo!=null) {
    quakeInfo.textContent =
    `for ${netCode}.${staCode} near ${time.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}`;
  }
  const orgdisp = document.querySelector(sp.organizeddisplay.ORG_DISPLAY) as sp.organizeddisplay.OrganizedDisplay;
  return retrieveStationXML()
  .then(staxml => {
    const sddList: Array<sp.seismogram.SeismogramDisplayData> = [];
    const timeRange = sp.util.centerTimeDuration(time, duration);
    for( const c of sp.stationxml.findChannels(staxml, netCode, staCode, '.*', 'H..')) {
      if (c.isActiveAt(time)) {
        const sdd = sp.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(c, timeRange);
        sddList.push(sdd);
      }
    }
    orgdisp.seisData = sddList;
    const dsQuery = new sp.fdsndataselect.DataSelectQuery();
    return dsQuery.postQuerySeismograms(sddList);
  }).then(_sddList => {
    orgdisp.redraw();
  }).catch( err => {
    sp.util.warn(err);
    throw err;
  });
}

function channelsH_Z(staxml: Array<sp.stationxml.Network>) {
  const filteredStaxml: Array<sp.stationxml.Network> = [];
  staxml.forEach( net => {
    filteredStaxml.push(net);
    net.stations.forEach(sta => {
      sta.channels = sta.channels.filter(c => c.channelCode[0]==='H' && c.channelCode[2]==='Z');
      if (sta.channels.length>1) {
        sta.channels = sta.channels.filter(c => c.channelCode[1]==='H');
      }
    });
  });
  return filteredStaxml;
}
