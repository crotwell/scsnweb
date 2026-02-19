import './style.css'
import {createPublicNavigation} from './navbar';
import * as sp from 'seisplotjs';
import {DateTime} from 'luxon';

import {retrieveStationXML} from './datastore';
import {addGraticule, stateBoundaries,
  WORLD_OCEAN, WORLD_OCEAN_ATTR
} from './maplayers';

const BASE_TILE = WORLD_OCEAN;
const BASE_TILE_ATTR = WORLD_OCEAN_ATTR;

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
<h5>Click a station (triangle) to see last 24 hours of data.</h5>
<sp-station-quake-map
      centerLat="33.5"
      centerLon="-81"
      zoomLevel="7"
      tileUrl='${BASE_TILE}'
      tileAttribution='${BASE_TILE_ATTR}'
      >
</sp-station-quake-map>
<h5>Mouse Time: <span id="mousetime"></span></h5>
<sp-helicorder></sp-helicorder>

`
}


const MINMAX_URL = "https://eeyore.seis.sc.edu/minmax";
//const MSEED_URL = "https://eeyore.seis.sc.edu/mseed";
const DEFAULT_LOC_CODE = "00";
const SEIS_MINMAX_CODE = "X";
const SM_MINMAX_CODE = "Y";

const heli = document.querySelector("sp-helicorder") as sp.helicorder.Helicorder;
if (!heli) {throw new Error("Can't find sp-helicorder");}
heli.addEventListener("helimousemove", (hEvent) => {
  if (hEvent instanceof CustomEvent && hEvent?.detail.time) {
    const mouseTimeSpan = document.querySelector("#mousetime");
    if (mouseTimeSpan) {
      mouseTimeSpan.textContent = `${hEvent.detail.time.toLocal().toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)}`;
    }
}
});
heli.addEventListener("mouseleave", (hEvent) => {
  if (hEvent instanceof CustomEvent && hEvent?.detail.time) {
    const mouseTimeSpan = document.querySelector("#mousetime");
    if (mouseTimeSpan) {
      mouseTimeSpan.textContent = "";
    }
  }
});

const map = document.querySelector("sp-station-quake-map") as sp.leafletutil.QuakeStationMap;
if (!map) {throw new Error("Can't find sp-station-quake-map");}
map.onRedraw = () => {
  addGraticule(map);
}
Promise.all([retrieveStationXML(), stateBoundaries(map)])
.then(([staxml, statelines]) => {
  staxml.forEach(net=> {
    map.addStation(net.stations);
  });
  map.addEventListener(sp.stationxml.STATION_CLICK_EVENT, (evt) => {
    if ( ! (evt instanceof CustomEvent ) || !(evt?.detail.station)) {
      throw new Error("event not sp.stationxml.STATION_CLICK_EVENT");
    }
    console.log(`sta click: ${evt?.detail.station.stationCode}`);
    let minMaxQ = new sp.mseedarchive.MSeedArchive(
          MINMAX_URL,
          "%n/%s/%Y/%j/%n.%s.%l.%c.%Y.%j.%H",
        );
    let minMaxInst = SM_MINMAX_CODE;
    let orientCode = "Z";
    for (let ch of evt.detail.station.channels) {
      if (ch.channelCode === "HHZ") {
        minMaxInst = SEIS_MINMAX_CODE;
        break;
      }
    }

    let chanCode =`L${minMaxInst}${orientCode}`;
    let fake = new sp.stationxml.Channel(
      evt.detail.station,
      chanCode,
      DEFAULT_LOC_CODE,
    );
    fake.sampleRate = 2;

    if (!heli.heliConfig.fixedTimeScale) {throw new Error("Heli must be fixedTimeScale");}
    let minMaxSddList = [
      sp.seismogram.SeismogramDisplayData.fromChannelAndTimeWindow(
          fake,
          heli.heliConfig.fixedTimeScale,
        )
      ];
    minMaxQ.loadSeismograms(minMaxSddList).then(sddList => {
      let nowMarker: sp.seismographmarker.MarkerType = {
            markertype: "predicted",
            name: "now",
            time: DateTime.utc(),
            description: "now"
          };
      if (sddList && sddList.length > 0) {
        sddList[sddList.length-1].addMarkers(nowMarker);
      }
      heli.heliConfig.title = `${evt.detail.station.stationCode} - ${evt.detail.station.name}`
      heli.heliConfig.lineSeisConfig.title = heli.heliConfig.title;
      heli.seisData = sddList;

    });
    return Promise.all([staxml, statelines]);
  });
  map.redraw();
});

setInterval( () => {
  if (heli.seisData && heli.seisData.length > 0) {
    let nowMarker = {
          markertype: "predicted",
          name: "now",
          time: DateTime.utc(),
          description: "now"
        };
    heli.seisData[0].addMarkers(nowMarker);
  }
}, 60*1000);
