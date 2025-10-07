

import * as L from 'leaflet';
import 'leaflet-polar-graticule';

export function bestLatLonGradiculeIncrement(bounds: L.LatLngBounds): Array<Number> {
  let outLat = 20;
  let outLng = 20;
  const latRange = bounds.getNorth()-bounds.getSouth();
  const lngRange = bounds.getEast()-bounds.getWest();
  console.log(`intervalLatLng  ${latRange}  ${lngRange}`)
  if (latRange < 1) {
    outLat = .25;
  } else if (latRange < 5) {
    outLat = 1;
  } else if (latRange < 20) {
    outLat = 2;
  } else if (latRange < 50) {
    outLat = 5;
  } else if (latRange < 80) {
    outLat = 10;
  } else {
    outLat = 20;
  }
  if (lngRange < 1) {
    outLng = .25;
  } else if (lngRange < 10) {
    outLng = 1;
  } else if (lngRange < 20) {
    outLng = 2;
  } else if (lngRange < 50) {
    outLng = 5;
  } else if (lngRange < 80) {
    outLng = 10;
  } else {
    outLng = 20;
  }
  return [ outLat, outLng ];
}
