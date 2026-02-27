import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import * as L from 'leaflet';
import "leaflet-polar-graticule";
import type {Feature, MultiPolygon} from 'geojson';

import {bestLatLonGradiculeIncrement} from './bestgraticule';

export const STATE_BOUNDARY_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/state_lines.json"
export const HATCHER_SC_GEOL = "http://www.seis.sc.edu/tilecache/Hatcher_SC_Geol/{z}/{x}/{y}.png"
export const ANCIENT_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_historical.json"
export const HISTORIC_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_historical.json"

export const HIST_QUAKES_GLOBAL_URL = "http://www.seis.sc.edu/tilecache/usgscatalog/{z}/{y}/{x}/"
// Overlay layers (TMS)

export const WORLD_OCEAN = "http://www.seis.sc.edu/tilecache/WorldOceanBase/{z}/{y}/{x}"
export const WORLD_OCEAN_ATTR = 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'


export function historicEarthquakes(timeRange?: Interval|null, style?: object ) {
  if (! style) {
    style = {
      color: "grey",
      weight: 0.75,
      fillColor: "white"
    };
  }
  if (! timeRange) {
    timeRange = Interval.before(DateTime.utc(), Duration.fromISO('P1MT1S'));
  }
  const historicalLayer =
    sp.usgsgeojson.loadRawUSGSGeoJsonSummary(HISTORIC_URL)
    .then(hisGeoJson => {
      hisGeoJson.features = hisGeoJson.features.filter(q => {
        const qTime = DateTime.fromMillis(q.properties.time);
        return qTime < timeRange.start;
      });
      //L.geoJSON(jsondata, options).addTo(this.map);

      return L.geoJSON(hisGeoJson,
                          {
                            pointToLayer: function(geoJsonPoint, latlng) {
                              let mag_radius = 3;
                              let mag_min = 2;
                              const eqTime = DateTime.fromMillis(geoJsonPoint.properties.time);
                              if (geoJsonPoint.properties.mag < mag_min){
                                return L.circleMarker(latlng,
                                    {
                                      radius: mag_radius,
                                    }
                                ).bindTooltip(`${eqTime.toLocaleString(DateTime.DATE_FULL)} ${geoJsonPoint.properties.mag}`);
                              } else {
                                return L.circleMarker(latlng,
                                    {
                                      radius: geoJsonPoint.properties.mag*mag_radius,
                                    }
                                ).bindTooltip(`${eqTime.toLocaleString(DateTime.DATE_FULL)} ${geoJsonPoint.properties.mag}`);
                              }
                            },
                            style: style
                          });

      return hisGeoJson;
    });
  return historicalLayer;
}

export const TECTONIC_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/tectonic.geojson"

if (!document.querySelector("dialog")) {
  const dialogEl = document.createElement("dialog");
  dialogEl.innerHTML = "<div></div>";
  document.querySelector("body")?.appendChild(dialogEl);
}
const dialog = document.querySelector("dialog");
const dialogDiv = document.querySelector("dialog div") as HTMLElement;
function tooltipper(feature: GeoJSON.Feature, layer: L.Layer) {
  const name = feature?.properties?.name ? feature.properties.name : "unknown";
  layer.bindTooltip( (() => name));
  layer.addEventListener("click", () => {
    console.log(`click ${feature.id} ${name}`);
    if (dialog && dialogDiv) {
      dialogDiv.innerHTML = feature?.properties?.summary;
      dialog.showModal();
    }
  });
};

export function tectonicSummary(eqMap: sp.leafletutil.QuakeStationMap, style?: object) {
  if (! style) {
    style = {
      color: "blue",
      weight: 0.5,
      fillColor: "none"
    }
  }
  return sp.usgsgeojson.loadUSGSTectonicLayer(TECTONIC_URL)
  .then((tecGeoJson: sp.usgsgeojson.USGSTectonicGeoJsonSummary) => {
    eqMap.addGeoJsonLayer("Tectonic Regions",
                        tecGeoJson.tectonic,
                        {
                          onEachFeature: tooltipper,
                          style: style
                        });
    return tecGeoJson;
  });
}


export interface StatesGeoJsonProperties {
  GEO_ID: string;
  STATE: string;
  NAME: string;
  LSAD: string;
  CENSUSAREA: string;
}

export function basicSCMap(div: HTMLDivElement, zoom=10, center=[33.70, -80.75]) {
  if (div == null) {
    console.log(`basicSCMap() div is null`);
  }
  const backgroundLayer = L.tileLayer(WORLD_OCEAN, {
  	maxZoom: 19,
  	attribution: WORLD_OCEAN_ATTR
  });
  const map = L.map(div, {
    center: center,
    zoom: zoom,
    layers: [backgroundLayer]
  });
  addGraticuleToMap(map);
  stateBoundaries().then(boundary=>boundary.addTo(map));
  return map;
}

export function addQuakesToMap(map, quakeList): Array<L.Marker> {
  const markers = [];
  quakeList.forEach(q => {markers.push(sp.leafletutil.createQuakeMarker(q))});
  const quakeLayer = L.layerGroup(markers);
  map.addLayer(quakeLayer);
  return markers;
}

export function addStationsToMap(map, stationList, classList?: Array<string>): Array<L.Marker> {
  const markers = [];
  stationList.forEach(sta => {
    const marker = sp.leafletutil.createStationMarker(sta, classList);
    markers.push(marker);
    marker.addEventListener("click", (evt) => {
      const ce = sp.stationxml.createStationClickEvent(sta, evt.originalEvent);
      map.getContainer().dispatchEvent(ce);
    });
  });
  const stationLayer = L.layerGroup(markers);
  map.addLayer(stationLayer);
  return markers;
}

export function stateBoundaries(style?: object) {
  if (!style) {
    style = {
      color: "black",
      weight: 0.5,
      opacity: 0.65,
      fillColor: "none"
    };
  }
  return sp.util.pullJson(STATE_BOUNDARY_URL)
  .then((statesJson: object) => {
    return statesJson as Feature<MultiPolygon, StatesGeoJsonProperties>;
  }).then((statesJson: Feature<MultiPolygon, StatesGeoJsonProperties>) => {
        return L.geoJSON(
                            statesJson,
                            {

                              style: style
                            }
                          );
    });
}


export function addGraticule(eqMap: sp.leafletutil.QuakeStationMap, style?: object) {
  if (!map) {throw new Error("map missing on QuakeStationMap");}
  addGraticuleToMap(eqMap.map, style);
}
export function addGraticuleToMap(map: sp.leafletutil.QuakeStationMap, style?: object) {
  if (!style) {
    style = {
        color: '#777',
        opacity: 1,
        weight: 1
    };
  }
  const intervalLatLng = bestLatLonGradiculeIncrement(map.getBounds());
  L.graticule({
      sphere: true,
      style: style,
      intervalLat: intervalLatLng[0],
      intervalLng: intervalLatLng[1],
      centerLonLabels: true ,
      lngBounds:[-180,181] ,
  }).addTo(map);
}
