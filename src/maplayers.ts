import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import * as L from 'leaflet';
import "leaflet-polar-graticule";

import {bestLatLonGradiculeIncrement} from './bestgraticule';

export const STATE_BOUNDARY_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/state_lines.json"
export const ANCIENT_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_ancient.json"
export const HISTORIC_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_historical.json"
export const HATCHER_SC_GEOL = "http://www.seis.sc.edu/tilecache/Hatcher_SC_Geol/{z}/{x}/{y}.png"

const HIST_QUAKES_GLOBAL_URL = "http://www.seis.sc.edu/tilecache/usgscatalog/{z}/{y}/{x}/"
// Overlay layers (TMS)

export function historicEarthquakesGlobal(eqMap: sp.leafletutil.QuakeStationMap) {

}

export function historicEarthquakes(eqMap: sp.leafletutil.QuakeStationMap, timeRange: Interval, style: object ) {
  if (! style) {
    style = {
      color: "grey",
      weight: 0.75,
      fillColor: "white"
    };
  }
  if (! timeRange) {
    timeRange = Interval.after(DateTime.utc(), Duration.fromISO('PT1S'));
  }
  const historicalLayer =
    sp.usgsgeojson.loadRawUSGSGeoJsonSummary(HISTORIC_URL).then(hisGeoJson => {
      hisGeoJson.features = hisGeoJson.features.filter(q => {
        const qTime = DateTime.fromMillis(q.properties.time);
        return qTime < timeRange.start;
      });
      eqMap.addGeoJsonLayer("Historic Earthquakes",
                          hisGeoJson,
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

function tooltipper(feature: L.Feature, layer: L.Layer) {
  layer.bindTooltip( (() => feature.properties.name));
  layer.addEventListener("click", (evt) => {
    console.log(`click ${feature.id} ${feature.properties.name}`);
    const dialogDiv = document.querySelector("dialog div");
    dialogDiv.innerHTML = feature.properties.summary;
    dialog.showModal();
  });
};

export function tectonicSummary(eqMap: sp.leafletutil.QuakeStationMap, style) {
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

export function stateBoundaries(eqMap: sp.leafletutil.QuakeStationMap, style: object) {
  if (!style) {
    style = {
      color: "black",
      weight: 0.5,
      opacity: 0.65,
      fillColor: "none"
    };
  }
  return sp.util.pullJson(STATE_BOUNDARY_URL).then((statesJson: object) => {
      eqMap.addGeoJsonLayer("US States",
                          statesJson,
                          {
                            style: style
                          }
                        );
      return statesJson;
    });
}


export function addGraticule(eqMap: sp.leafletutil.QuakeStationMap, style: object) {
  if (!style) {
    style = {
        color: '#777',
        opacity: 1,
        weight: 1
    };
  }
  const intervalLatLng = bestLatLonGradiculeIncrement(eqMap.map.getBounds());
        L.graticule({
            sphere: true,
            style: style,
            intervalLat: intervalLatLng[0],
            intervalLng: intervalLatLng[1],
            centerLonLabels: true ,
            lngBounds:[-180,181] ,
        }).addTo(eqMap.map);
}
