import {default as sp} from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';

export const SC_QUAKE_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_quakes.xml"
export const SC_STATION_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_channels.staml"
export const ANCIENT_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_ancient.json"
export const HISTORIC_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_historical.json"


export function retrieveStationXML(): Promise<Array<sp.stationxml.Network>> {
  return sp.stationxml.fetchStationXml(SC_STATION_URL)
  .then((staxml: Array<sp.stationxml.Network>) => {
    // filter so only HH? and HN?
    staxml.forEach(net=> {
      net.stations = net.stations.filter((sta: sp.stationxml.Station) => !sta.endDate); // active, so no endDate
      net.stations.forEach((sta: sp.stationxml.Station) => {
        const seisChans = sta.channels.filter((ch: sp.stationxml.Channel) => ch.channelCode.startsWith("H") &&
            ch.channelCode.charAt(1) === 'H');
        const smChans = sta.channels.filter((ch: sp.stationxml.Channel) => ch.channelCode.startsWith("H") &&
            ch.channelCode.charAt(1) === 'N');
        if (seisChans.length > 0) {
          sta.channels = seisChans;
        } else {
          sta.channels = smChans;
        }
      });
      net.stations = net.stations.filter((sta: sp.stationxml.Station) => sta.channels.length > 0);
    });
    staxml = staxml.filter(net => net.stations.length > 0);
    return staxml;
  });
}

export function seismometerChannels(staxml: Array<sp.stationxml.Network>): Array<sp.stationxml.Network> {
  staxml.forEach(net=> {
    net.stations.forEach((sta: sp.stationxml.Station) => {
      const seisChans = sta.channels.filter((ch: sp.stationxml.Channel) => ch.channelCode.startsWith("H") &&
          ch.channelCode.charAt(1) === 'H');
      sta.channels = seisChans;
    });
    net.stations = net.stations.filter((sta: sp.stationxml.Station) => sta.channels.length > 0);
  });

  staxml = staxml.filter(net => net.stations.length > 0);
  return staxml;
}

export function verticalChannels(staxml: Array<sp.stationxml.Network>): Array<sp.stationxml.Network> {
  staxml.forEach(net=> {
    net.stations.forEach((sta: sp.stationxml.Station) => {
      const seisChans = sta.channels.filter((ch: sp.stationxml.Channel) => ch.channelCode.charAt(2) === 'Z');
      sta.channels = seisChans;
    });
    net.stations = net.stations.filter((sta: sp.stationxml.Station) => sta.channels.length > 0);
  });

  staxml = staxml.filter(net => net.stations.length > 0);
  return staxml;
}

export function loadStations(): Promise<Array<sp.stationxml.Station>> {
  let staStored = localStorage.getItem("stationxml");
  if (!staStored) {
    return retrieveStationXML().then( staxml => {
      //localStorage.setItem("stationxml", JSON.stringify(staxml));
      let staList: Array<sp.stationxml.Station> =
        Array.from(sp.stationxml.activeStations(staxml));
      return staList;
    })
  } else {
    return new Promise((resolve, _reject) => { resolve(JSON.parse(staStored)); });
  }
}


const sc_minlat = 32.0;
const sc_maxlat = 35.25;
const sc_minlon = -83.5;
const sc_maxlon = -78.4;

export function quakeById(eventId: string): Promise<sp.quakeml.Quake|null> {
  const quakeUrl = `https://eeyore.seis.sc.edu/scsn/sc_quakes/by_eventid/eventid_${eventId}`;
  return sp.quakeml.fetchQuakeML(quakeUrl)
  .catch((err: any) => {
    // not from SCSN, so try USGS
    const query = new sp.fdsnevent.EventQuery().eventId(eventId);
    return query.queryEventParameters();
  }).then((qml: sp.quakeml.EventParameters) => {
    if (qml.eventList.length !== 0) {
      const q = qml.eventList[0];
      checkForNullMagnitude([q]);
      return q;
    } else {
      return null;
    }
  });
}

export function retrieveSCQuakesWeek(): Promise<Array<sp.quakeml.Quake>> {
  return sp.usgsgeojson.loadWeekSummaryAll()
  .then((quakeList: Array<sp.quakeml.Quake>) => {
    return quakeList.filter( q => {
      return sc_minlat <= q.latitude && q.latitude <= sc_maxlat
        && sc_minlon <= q.longitude && q.longitude <= sc_maxlon;
    });
  }).then(checkForNullMagnitude);
}

export function retrieveQuakeML(): Promise<sp.quakeml.EventParameters> {
  return sp.quakeml.fetchQuakeML(SC_QUAKE_URL)
  .then((qml: sp.quakeml.EventParameters) => {
    checkForNullMagnitude(qml.eventList);
    return qml;
  });
}
export function retrieveHistoric(): Promise<Array<sp.quakeml.Quake>> {
  return sp.usgsgeojson.loadUSGSSummary(HISTORIC_URL).then(checkForNullMagnitude);
}
export function retrieveAncient(): Promise<Array<sp.quakeml.Quake>> {
  return sp.usgsgeojson.loadUSGSSummary(ANCIENT_URL).then(checkForNullMagnitude);
}

export function retrieveGlobalSignificant(timeRange?: Interval): Promise<sp.quakeml.EventParameters> {
  if (timeRange == null) {
    const ONE_MONTH = Duration.fromISO("P31D");
    const NOW = DateTime.utc();
    timeRange = sp.util.startEnd(NOW.minus(ONE_MONTH), NOW);
  }
  if (timeRange != null && timeRange.isValid && timeRange.start?.isValid && timeRange.end?.isValid) {
    const usgsSignificantUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query.geojson?starttime=${timeRange.start.toISO()}&endtime=${timeRange.end.toISO()}&minsig=600&orderby=time`
    return sp.usgsgeojson.loadRawUSGSGeoJsonSummary(usgsSignificantUrl)
    .then((geojson: sp.usgsgeojson.USGSGeoJsonSummary) => {
      return sp.usgsgeojson.parseGeoJSON(geojson);
    }).then(checkForNullMagnitude);
  } else {
    throw new Error("Invalid time range");
  }
}

export const zeroMagQuantity = new sp.quakeml.Quantity<number>(0.0);
export function checkForNullMagnitude(quakeList: Array<sp.quakeml.Quake>) {
  quakeList.forEach(q => {
    if (q.magnitude == null) {
      // force to 0.0

      q.preferredMagnitude = new sp.quakeml.Magnitude(zeroMagQuantity, "unk");
      q.preferredMagnitude.origin = q.preferredOrigin;
      q.magnitudeList.push(q.preferredMagnitude);
    } else if (q.magnitude.magQuantity == null) {
      q.magnitude.magQuantity = zeroMagQuantity;
    }
  });
  return quakeList;
}
