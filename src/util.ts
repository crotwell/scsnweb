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

export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");


export function createQuakeTable(quakes: Array<sp.quakeml.Quake>): sp.infotable.QuakeTable {
    let colDefaultLabels = sp.infotable.QuakeTable.createDefaultColumnLabels();
    colDefaultLabels.delete(sp.infotable.QUAKE_COLUMN.TIME);
    //colDefaultLabels.set(sp.infotable.QUAKE_COLUMN.EVENTID, "EventId");
    let colLabels = new Map();
    colLabels.set(sp.infotable.QUAKE_COLUMN.LOCALTIME, "Time (Eastern)");
    for (let k of colDefaultLabels.keys()) {
      colLabels.set(k, colDefaultLabels.get(k));
    }

    colLabels.delete(sp.infotable.QUAKE_COLUMN.MAGTYPE);

    let quakeTable = new sp.infotable.QuakeTable([], colLabels);
    quakeTable.timeZone = EASTERN_TIMEZONE;

    quakeTable.quakeList = quakes;
    return quakeTable;
}
