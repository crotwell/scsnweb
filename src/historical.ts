import './style.css'
import './leaflet.css'

import * as sp from 'seisplotjs';
import {DateTime, Duration, Interval} from 'luxon';
import {retrieveQuakeML} from './datastore';
import {createPublicNavigation} from './navbar';
import {
  basicSCMap,
  addQuakesToMap,
  historicEarthquakes,
  stateBoundaries,
  HISTORIC_URL, ANCIENT_URL
} from './maplayers';
import {init} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
  <div id='map' width="300" height="300"></div>
  <div id='table'>
  </div>
  <dialog>
    <div>
    </div>
    <button autofocus>Close</button>
  </dialog>
`
}

const dialog = document.querySelector("dialog");
const closeDialogButton = document.querySelector("dialog button");
if (!dialog || !closeDialogButton) {throw new Error("Can't find dialog");}
closeDialogButton.addEventListener("click", () => {
  dialog.close();
});



const quakeMap = basicSCMap(document.querySelector("#map")!, 7);

const hist_style = {
  color: "black",
  weight: 0.75,
  fillColor: "white"
};
const timeRange = Interval.before(DateTime.utc(), Duration.fromISO('P1MT1S'));
historicEarthquakes(timeRange, hist_style)
.then(historicalLayer => historicalLayer.addTo(quakeMap))
.then(() => {
  return retrieveQuakeML().then(qml => {
    const monthQuakes = qml.eventList.filter(q => timeRange.contains(q.time));
    addQuakesToMap(quakeMap, monthQuakes);
    return qml;
  })
}).then(() => {
  return stateBoundaries().then(boundary=>{
    boundary.addTo(quakeMap);
    return quakeMap;
  });
});

const eqUrls = [
  //ANCIENT_URL,
  HISTORIC_URL,

];
