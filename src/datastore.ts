import * as sp from 'seisplotjs';


export const SC_QUAKE_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_quakes.xml"
export const SC_STATION_URL = "https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_channels.staml"


export function retrieveStationXML(): Promise<Array<sp.stationxml.Network>> {
  return sp.stationxml.fetchStationXml(SC_STATION_URL).then(staxml => {
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
}

export function loadStations(): Promise<Array<sp.stationxml.Station>> {
  let staStored = localStorage.getItem("stationxml");
  if (!staStored) {
    return retrieveStationXML().then( staxml => {
      //localStorage.setItem("stationxml", JSON.stringify(staxml));
      let staList = [];
      staxml.forEach(net=> {
        staList = staList.concat(net.stations);
      });
      return staList;
    })
  } else {
    return new Promise((resolve, reject) => { resolve(JSON.parse(staStored)); });
  }
}

export function retrieveQuakeML(): Promise<sp.quakeml.EventParameters> {
  return sp.quakeml.fetchQuakeML(SC_QUAKE_URL);
}
