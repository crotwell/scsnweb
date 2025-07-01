import './style.css'
import scLogo from '/usc_logo_horizontal_rgb_g_rev.svg'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';

import {createNavigation} from './navbar';

export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!


if (true) {
app.innerHTML = `
  <h3>Recent Earthquakes near South Carolina</h3>
  <sp-station-quake-map
    tileUrl="http://www.seis.sc.edu/tilecache/NatGeo/{z}/{y}/{x}"
    tileAttribution='Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
    zoomLevel="7"
    centerLat="33.5" centerLon="-81"
    fitbounds="false">
  </sp-station-quake-map>
`
}


const SC_QUAKE_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_quakes.xml"
const SC_STATION_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_channels.staml"
const TECTONIC_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/tectonic.geojson"

let allQuakes = [];
export type PageState = {
  quakeList: Array<sp.quakeml.Quake>,
  channelList: Array<sp.stationxml.Channel>,
  dataset: sp.dataset.Dataset,
};

let pageState: PageState = {
  quakeList: [],
  channelList: [],
  dataset: new sp.dataset.Dataset(),
}

function displayForTime(timeRange: Interval, quakes: Array<Quake>): Array<Quake> {
  const quakesInTime = allQuakes.filter(q => {
    return timeRange.start <= q.time && q.time <= timeRange.end;
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

  quakeMap.setAttribute(sp.leafletutil.TILE_TEMPLATE,
    'https://www.seis.sc.edu/tilecache/WorldOceanBase/{z}/{y}/{x}/'
  );
  quakeMap.setAttribute(sp.leafletutil.TILE_ATTRIBUTION,
    'Tiles &copy; Esri, Garmin, GEBCO, NOAA NGDC, and other contributors'
  );
  quakeMap.zoomLevel = 7;
  if (pageState.channelList.length > 0) {
    quakeMap.centerLat = pageState.channelList[0].latitude;
    quakeMap.centerLon = pageState.channelList[0].longitude;
  } else {
    quakeMap.centerLat = 34.0;
    quakeMap.centerLon = -81.0;
  }


  quakeTable.quakeList = quakesInTime;
  app.appendChild(quakeTable);
  quakeTable.draw();
  quakeMap.quakeList = []
  quakeMap.addQuake(quakesInTime);
  quakeMap.draw();
}


const quakeQuery = sp.quakeml.fetchQuakeML(SC_QUAKE_URL);
const chanQuery = sp.stationxml.fetchStationXml(SC_STATION_URL).then(staxml => {
  // filter so only HH? and HN?
  staxml.forEach(net=> {
    net.stations = net.stations.filter(sta => !sta.endDate); // active, so no endDate
    net.stations.forEach(sta => {
      sta.channels = sta.channels.filter(ch => ch.channelCode.startsWith("H") && (
          ch.channelCode.charAt(1) === 'H' || ch.channelCode.charAt(1) === 'N') &&
          ch.channelCode.charAt(2) === 'Z');
    });
    //net.stations = net.stations.filter(sta => sta.stationCode === "JSC" || sta.stationCode === "PARR");
    net.stations = net.stations.filter(sta => sta.channels.length > 0);
  });
  staxml = staxml.filter(net => net.stations.length > 0);
  return staxml;
});
Promise.all([ quakeQuery, chanQuery ]).then( ([qml, staxml]) => {
  console.log(`qml len: ${qml.eventList.length}`)
  pageState.quakeList = qml.eventList;
  pageState.dataset.inventory = staxml;
  pageState.channelList = Array.from(sp.stationxml.allChannels(staxml));

  allQuakes = qml.eventList;
  //const trEl = document.querySelector("sp-timerange");
  const timeRange = Interval.before(DateTime.utc(), Duration.fromISO('P1Y'));
  displayForTime(timeRange, allQuakes);

  let table = document.querySelector("sp-quake-table");
  console.log(`got ${qml.eventList.length} quakes ${table.quakeList.length}`)
  const map = document.querySelector("sp-station-quake-map");
  staxml.forEach(net=> {
    map.addStation(net.stations);
  });
  map.draw();
  return [qml, staxml];
}).then( ([qml, staxml]) => {
  function tooltipper(feature, layer) {
    console.log("tooltip")
    layer.bindTooltip( (f => feature.properties.name));
    layer.addEventListener("click", (evt) => {
      console.log(`click ${feature.properties.name}`);
    });
  };
  const tectonicLayer =
    sp.usgsgeojson.loadUSGSTectonicLayer(TECTONIC_URL).then(tecGeoJson => {
      const map = document.querySelector("sp-station-quake-map");
      map.addGeoJsonLayer("Tectonic Regions",
                          tecGeoJson.tectonic,
                          {
                            onEachFeature: tooltipper
                          });
      map.draw();
      return tecGeoJson;
    });
  return Promise.all([qml, staxml, tectonicLayer])
});
