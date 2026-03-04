import './style.css'
import {createResearchNavigation} from './navbar';

import {init} from './util';
init();

createResearchNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
<h3>Research</h3>

<p>The seismology program at the University of South Carolina is
  involved in the study of earthquakes and the internal structure of
  the earth from the crust to the core under the direction of
  <a href="https://sc.edu/study/colleges_schools/artsandsciences/earth_ocean_and_environment/our_people/directory/frost_dan.php">
  Dr. Dan Frost</a>. He maintains an active research program, with more
  information available on his
  <a href="https://danielafrost.com/">personal website</a>.
</p>

<p>
  We operate the
  <a href="${import.meta.env.BASE_URL}outreach/index.html">
  South Carolina Seismic Network</a>,
  which is responsible for monitoring earthquakes in the state.
</p>
<p>
  We have developed several
  <a href="${import.meta.env.BASE_URL}software/index.html">Software</a>
  packages and libraries, both for research and for general use.
</p>

`
}
