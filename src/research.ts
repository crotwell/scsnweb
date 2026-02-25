import './style.css'
import {createResearchNavigation} from './navbar';

createResearchNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
<h3>Research</h3>

<p>The seismology program at the University of South Carolina is
  involved in the study of earthquakes and the internal structure of
  the earth from the crust to the core.
</p>

<ul class="blurb">
  <li>
    <h3>Project A</h3>
    <a href="https://github.com/crotwell/seisplotjs">project a</a> is a
      project.
  </li>
  <li>
    <h3>Project B</h3>
    <a href="https://github.com/crotwell/seisplotjs">project b</a> is a
      project.
  </li>
  <li>
    <h3>Project C</h3>
    <a href="https://github.com/crotwell/seisplotjs">project c</a> is a
      project.
  </li>
</ul>

`
}
