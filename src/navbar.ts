
import scLogo from '/usc_logo_horizontal_rgb_g_rev.svg'

let navHeader = `
<header>
  <div class="uscLogo">
  <a href="https://sc.edu" target="_blank">
    <img src="${scLogo}" class="logo" alt="USC logo" />
  </a>
  </div>
  <div class="scsnLogo">
    <span>South Carolina Seismic Network</span>
  </div>
</header>
`;

let navPublic = `
<nav class="sidebar">
  <ul>
    <li><a href="${import.meta.env.BASE_URL}index.html">Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}helicorder/index.html">Today's Seismograms</a></li>
    <li><a href="${import.meta.env.BASE_URL}historical/index.html">Historical Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}global/index.html">Global Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}software/index.html">Software</a></li>
    <li><a href="${import.meta.env.BASE_URL}about/index.html">About</a></li>
    <li><a href="${import.meta.env.BASE_URL}contact/index.html">Contact</a></li>
  </ul>
</nav>
`;

let navResearch = `
<nav class="sidebar">
  <ul>
    <li><a href="${import.meta.env.BASE_URL}index.html">Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}helicorder/index.html">Today's Seismograms</a></li>
    <li><a href="${import.meta.env.BASE_URL}historical/index.html">Historical Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}global/index.html">Global Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}software/index.html">Software</a></li>
    <li><a href="${import.meta.env.BASE_URL}about/index.html">About</a></li>
    <li><a href="${import.meta.env.BASE_URL}contact/index.html">Contact</a></li>
  </ul>
</nav>
`;

export function createPublicNavigation() {
  const navDiv = document.querySelector<HTMLDivElement>('#nav')!
  if (navDiv) {
    navDiv.innerHTML = navHeader + navPublic;
  }
}

export function createResearchNavigation() {
  const navDiv = document.querySelector<HTMLDivElement>('#nav')!
  if (navDiv) {
    navDiv.innerHTML = navHeader + navResearch;
  }
}
