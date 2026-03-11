import './style.css'
import {createPublicNavigation} from './navbar';
import {DateTime, Duration, Interval} from 'luxon';
import {retrieveStationXML, retrieveSCQuakesWeek} from './datastore';
import {createMapAndTable, quakeTableCaptionSC} from './map_table';
import {stateBoundaries} from './maplayers';

import {init} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `

<h3>Did an earthquake happen?</h3>
<p>
  Did you you feel something and want to know if it was an earthquake? The map
  below shows earthquakes detected in South Carolina in the last week.
  Check the list of <a href="${import.meta.env.BASE_URL}scquakes/index.html">recent earthquakes</a> in South Carolina
  to see if one has been detected. Note that especially for small
  earthquakes during non-business times, it may be a few hours before it
  shows up in the list.
</p>
<h3>Where have earthquakes happened in South Carolina in the past?</h3>
<p>
  The patterns of <a href="${import.meta.env.BASE_URL}historical">historical seismicity</a>
  in South Carolina are quite varied.

</p>

  <h3>Recent Earthquakes near South Carolina, (1 week)</h3>

    <div id='maptable' ></div>
`;
}

const recentQuakeTimeDuration = Duration.fromISO("P1W");
const timeRange = Interval.before(DateTime.utc(), recentQuakeTimeDuration);
const quakeQuery = retrieveSCQuakesWeek();
const chanQuery = retrieveStationXML();
createMapAndTable("#maptable", timeRange, quakeQuery, chanQuery)
.then(([quakeMap, quakeTable])=> {
  quakeTableCaptionSC(quakeTable, recentQuakeTimeDuration);
  const stateBound = stateBoundaries().then(boundary=>{
    boundary.addTo(quakeMap);
    return quakeMap;
  });
  return Promise.all([quakeMap, quakeTable, stateBound]);
}).then(() => {
  console.log("main done map,table")
}).catch( err => {
  sp.util.warn(err);
  throw err;
});
