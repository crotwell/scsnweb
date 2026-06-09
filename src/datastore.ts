
import {fdsnevent, quakeml, stationxml, usgsgeojson, util as sp_util} from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';

export const SC_QUAKE_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_quakes.xml"
export const SC_STATION_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_channels.staml"
export const ANCIENT_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_ancient.json"
export const HISTORIC_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_historical.json"


export function retrieveStationXML(): Promise<Array<stationxml.Network>> {
  return stationxml.fetchStationXml(SC_STATION_URL)
  .then((staxml: Array<stationxml.Network>) => {
    // filter so only HH? and HN?
    staxml.forEach(net=> {
      net.stations = net.stations.filter((sta: stationxml.Station) => !sta.endDate); // active, so no endDate
      net.stations.forEach((sta: stationxml.Station) => {
        const seisChans = sta.channels.filter((ch: stationxml.Channel) => ch.channelCode.startsWith("H") &&
            ch.channelCode.charAt(1) === 'H');
        const smChans = sta.channels.filter((ch: stationxml.Channel) => ch.channelCode.startsWith("H") &&
            ch.channelCode.charAt(1) === 'N');
        if (seisChans.length > 0) {
          sta.channels = seisChans;
        } else {
          sta.channels = smChans;
        }
      });
      net.stations = net.stations.filter((sta: stationxml.Station) => sta.channels.length > 0);
    });
    staxml = staxml.filter(net => net.stations.length > 0);
    return staxml;
  });
}

export function seismometerChannels(staxml: Array<stationxml.Network>): Array<stationxml.Network> {
  staxml.forEach(net=> {
    net.stations.forEach((sta: stationxml.Station) => {
      const seisChans = sta.channels.filter((ch: stationxml.Channel) => ch.channelCode.startsWith("H") &&
          ch.channelCode.charAt(1) === 'H');
      sta.channels = seisChans;
    });
    net.stations = net.stations.filter((sta: stationxml.Station) => sta.channels.length > 0);
  });

  staxml = staxml.filter(net => net.stations.length > 0);
  return staxml;
}

export function verticalChannels(staxml: Array<stationxml.Network>): Array<stationxml.Network> {
  staxml.forEach(net=> {
    net.stations.forEach((sta: stationxml.Station) => {
      const seisChans = sta.channels.filter((ch: stationxml.Channel) => ch.channelCode.charAt(2) === 'Z');
      sta.channels = seisChans;
    });
    net.stations = net.stations.filter((sta: stationxml.Station) => sta.channels.length > 0);
  });

  staxml = staxml.filter(net => net.stations.length > 0);
  return staxml;
}

export function loadStations(): Promise<Array<stationxml.Station>> {
  let staStored = localStorage.getItem("stationxml");
  if (!staStored) {
    return retrieveStationXML().then( staxml => {
      //localStorage.setItem("stationxml", JSON.stringify(staxml));
      let staList: Array<stationxml.Station> =
        Array.from(stationxml.activeStations(staxml));
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

export function quakeById(eventId: string): Promise<quakeml.Quake|null> {
  if (knownQuakes.has(eventId)) {
    const q = knownQuakesget(eventId);
    if (q == null) {
      knownQuakes.delete(eventId);
    }
  }
  const quakeUrl = `https://eeyore.seis.sc.edu/scsn/sc_quakes/by_eventid/eventid_${eventId}`;
  return quakeml.fetchQuakeML(quakeUrl)
  .catch((_err: any) => {
    // not from SCSN, so try USGS
    const query = new fdsnevent.EventQuery().eventId(eventId);
    return query.queryEventParameters();
  }).then((qml: quakeml.EventParameters) => {
    if (qml.eventList.length !== 0) {
      const q = qml.eventList[0];
      checkForNullMagnitude([q]);
      knownQuakes.set(eventId, q);
      return q;
    } else {
      return null;
    }
  });
}

export function retrieveSCQuakesWeek(): Promise<Array<quakeml.Quake>> {
  return usgsgeojson.loadWeekSummaryAll()
  .then((quakeList: Array<quakeml.Quake>) => {
    return quakeList.filter( q => {
      return sc_minlat <= q.latitude && q.latitude <= sc_maxlat
        && sc_minlon <= q.longitude && q.longitude <= sc_maxlon;
    });
  }).then(checkForNullMagnitude).then(addToKnownQuakes);
}

export function retrieveQuakeML(): Promise<quakeml.EventParameters> {
  return quakeml.fetchQuakeML(SC_QUAKE_URL)
  .then((qml: quakeml.EventParameters) => {
    checkForNullMagnitude(qml.eventList);
    return qml;
  });
}
export function retrieveHistoric(): Promise<Array<quakeml.Quake>> {
  return usgsgeojson.loadUSGSSummary(HISTORIC_URL).then(checkForNullMagnitude);
}
export function retrieveAncient(): Promise<Array<quakeml.Quake>> {
  return usgsgeojson.loadUSGSSummary(ANCIENT_URL).then(checkForNullMagnitude);
}

export function retrieveGlobalSignificant(timeRange?: Interval): Promise<quakeml.EventParameters> {
  if (timeRange == null) {
    const ONE_MONTH = Duration.fromISO("P31D");
    const NOW = DateTime.utc();
    timeRange = sp_util.startEnd(NOW.minus(ONE_MONTH), NOW);
  }
  if (timeRange != null && timeRange.isValid && timeRange.start?.isValid && timeRange.end?.isValid) {
    const usgsSignificantUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query.geojson?starttime=${timeRange.start.toISO()}&endtime=${timeRange.end.toISO()}&minsig=600&orderby=time`
    return usgsgeojson.loadRawUSGSGeoJsonSummary(usgsSignificantUrl)
    .then((geojson: usgsgeojson.USGSGeoJsonSummary) => {
      return usgsgeojson.parseGeoJSON(geojson);
    }).then((ep: quakeml.EventParameters) => {
      checkForNullMagnitude(ep.eventList);
      addToKnownQuakes(ep.eventList);
      return ep;
    });
  } else {
    throw new Error("Invalid time range");
  }
}

export const zeroMagQuantity = new quakeml.Quantity<number>(0.0);
export function checkForNullMagnitude(quakeList: Array<quakeml.Quake>) {
  quakeList.forEach(q => {
    if (q.magnitude == null) {
      // force to 0.0

      q.preferredMagnitude = new quakeml.Magnitude(zeroMagQuantity, "unk");
      q.preferredMagnitude.origin = q.preferredOrigin;
      q.magnitudeList.push(q.preferredMagnitude);
    } else if (q.magnitude.magQuantity == null) {
      q.magnitude.magQuantity = zeroMagQuantity;
    }
  });
  return quakeList;
}

export function addToKnownQuakes(quakeList: Array<quakeml.Quake>) {
  while (knownQuakes.size > 150) {
    knownQuakes.delete(knownQuakes.keys().iterator.next().value)
  }
  quakeList.forEach(q => {
    knownQuakes.set(q.eventId, q);
  });
  return quakeList;
}

export const knownQuakes = new Map<string, quakeml.Quake>();
