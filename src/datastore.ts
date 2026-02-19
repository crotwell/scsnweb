
import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';

export const SC_QUAKE_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_quakes.xml"
export const SC_STATION_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_channels.staml"
export const ANCIENT_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_ancient.json"
export const HISTORIC_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_historical.json"


export function retrieveStationXML(): Promise<Array<sp.stationxml.Network>> {
  return sp.stationxml.fetchStationXml(SC_STATION_URL).then(staxml => {
    // filter so only HH? and HN?
    staxml.forEach(net=> {
      net.stations = net.stations.filter(sta => !sta.endDate); // active, so no endDate
      net.stations.forEach(sta => {
        const seisChans = sta.channels.filter(ch => ch.channelCode.startsWith("H") && (
            ch.channelCode.charAt(1) === 'H') &&
            ch.channelCode.charAt(2) === 'Z');
        const smChans = sta.channels.filter(ch => ch.channelCode.startsWith("H") && (
            ch.channelCode.charAt(1) === 'N') &&
            ch.channelCode.charAt(2) === 'Z');
        if (seisChans.length > 0) {
          sta.channels = seisChans;
        } else {
          sta.channels = smChans;
        }
      });
      //net.stations = net.stations.filter(sta => sta.stationCode === "JSC" || sta.stationCode === "PARR");
      net.stations = net.stations.filter(sta => sta.channels.length > 0);
    });
    staxml = staxml.filter(net => net.stations.length > 0);
    return staxml;
  });
}

export function seismometerChannels(staxml: Array<sp.stationxml.Network>): Array<sp.stationxml.Network> {
  staxml.forEach(net=> {
    net.stations.forEach(sta => {
      const seisChans = sta.channels.filter(ch => ch.channelCode.startsWith("H") && (
          ch.channelCode.charAt(1) === 'H') &&
          ch.channelCode.charAt(2) === 'Z');
      sta.channels = seisChans;
    });
    net.stations = net.stations.filter(sta => sta.channels.length > 0);
  });

  staxml = staxml.filter(net => net.stations.length > 0);
  return staxml;
}

export function loadStations(): Promise<Array<sp.stationxml.Station>> {
  let staStored = localStorage.getItem("stationxml");
  if (!staStored) {
    return retrieveStationXML().then( staxml => {
      //localStorage.setItem("stationxml", JSON.stringify(staxml));
      let staList: Array<sp.stationxml.Station> = [];
      staxml.forEach(net=> {
        staList = staList.concat(net.stations);
      });
      return staList;
    })
  } else {
    return new Promise((resolve, _reject) => { resolve(JSON.parse(staStored)); });
  }
}

export function retrieveQuakeML(): Promise<sp.quakeml.EventParameters> {
  return sp.quakeml.fetchQuakeML(SC_QUAKE_URL);
}
export function retrieveHistoric(): Promise<Array<sp.quakeml.Quake>> {
  return sp.usgsgeojson.loadUSGSSummary(HISTORIC_URL);
}
export function retrieveAncient(): Promise<Array<sp.quakeml.Quake>> {
  return sp.usgsgeojson.loadUSGSSummary(ANCIENT_URL);
}

export function retrieveGlobalSignificant(timeRange?: Interval): Promise<sp.quakeml.EventParameters> {
  if (!timeRange) {
    const ONE_MONTH = Duration.fromISO("P31D");
    const NOW = DateTime.utc();
    timeRange = sp.util.startEnd(NOW.minus(ONE_MONTH), NOW);
  }
  if (timeRange.isValid && timeRange.start?.isValid && timeRange.end?.isValid) {
    const usgsSignificantUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query.geojson?starttime=${timeRange.start.toISO()}&endtime=${timeRange.end.toISO()}&minsig=600&orderby=time`
    return sp.usgsgeojson.loadRawUSGSGeoJsonSummary(usgsSignificantUrl).then((geojson: sp.usgsgeojson.USGSGeoJsonSummary) => {
      return sp.usgsgeojson.parseGeoJSON(geojson);
    });
  } else {
    throw new Error("Invalid time range");
  }
}
