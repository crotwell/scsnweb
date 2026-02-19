import {Settings} from 'luxon';

import * as sp from 'seisplotjs';

export function init() {
  Settings.throwOnInvalid = true;
}

export const EASTERN_TIMEZONE = new sp.luxon.IANAZone("America/New_York");


export function createQuakeTable(quakes: Array<sp.quakeml.Quake>) {
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

    quakeTable.quakeList = quakes;
    return quakeTable;
}
