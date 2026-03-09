import {Settings} from 'luxon';

import * as sp from 'seisplotjs';
export function insertFlavicon() {
  const flaviconLinks = `
  <link rel="apple-touch-icon" sizes="180x180" href="${import.meta.env.BASE_URL}favicon/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="${import.meta.env.BASE_URL}favicon/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="${import.meta.env.BASE_URL}favicon/favicon-16x16.png">
  <link rel="manifest" href="${import.meta.env.BASE_URL}favicon/site.webmanifest">
  `;
  document.head.innerHTML += flaviconLinks;
}

export function init() {
  Settings.throwOnInvalid = true;
  insertFlavicon();

  sp.cssutil.insertCSS(sp.leafletutil.leaflet_css, "spjs_leaflet");
  sp.cssutil.insertCSS(sp.leafletutil.stationMarker_css, "spjs_station");
  sp.util.updateVersionText('.sp_version');


}
