import './style.css'
import {createPublicNavigation} from './navbar';

import {init} from './util';
init();

createPublicNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `

<h3>Did an earthquake happen?</h3>
<p>
  Did you you feel something and want to know if it was an earthquake?
  Check the list of <a href="${import.meta.env.BASE_URL}scquakes/index.html">recent earthquakes</a> in South Carolina
  to see if one has been detected. Note that especially for small
  earthquakes during non-business times, it may be a few hours before it
  shows up in the list.
</p>
<h3>Where have earthquakes happened in South Carolina?</h3>
<p>
  The patterns of <a href="${import.meta.env.BASE_URL}historical">historical seismicity</a>
  in South Carolina are quite varied.

</p>
`;
}
