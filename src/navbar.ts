
import scLogo from '/usc_logo_horizontal_rgb_g_rev.svg'
import seoeLogo from '/usc_logo_horizontal_rgb_g_rev.svg'

let navHeader = `
<header>
  <div class="uscLogo">
  <a href="https://sc.edu" target="_blank">
    <img src="${scLogo}" class="logo" alt="USC logo" />
  </a>
    <span class="seoeLogo"><a href="https://seoe.sc.edu" target="_blank">
    School of Earth, Ocean and Environment</a></span>
  </div>
  <div class="scsnLogo">
    <span><a href="${import.meta.env.BASE_URL}index.html">South Carolina Seismic Network</a></span>
    <span id="nav"></span>
  </div>
</header>
`;

let navPublic = `
<nav class="sidebar">
  <ul>
    <li><a href="${import.meta.env.BASE_URL}scquakes/index.html">Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}helicorder/index.html">Today's Seismograms</a></li>
    <li><a href="${import.meta.env.BASE_URL}historical/index.html">Historical Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}global/index.html">Global Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}about/index.html">About</a></li>
    <li><a href="${import.meta.env.BASE_URL}contact/index.html">Contact</a></li>
  </ul>
</nav>
`;

let navResearch = `
<nav class="sidebar">
  <ul>
    <li><a href="${import.meta.env.BASE_URL}scquakes/index.html">Earthquakes</a></li>
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
  const navDiv = document.querySelector<HTMLDivElement>('#head')!
  if (navDiv) {
    navDiv.innerHTML = navHeader;
  }
  const innerNav = document.querySelector<HTMLDivElement>('#nav')!
  if (innerNav) {
    innerNav.innerHTML = navPublic;
  }
}

export function createResearchNavigation() {
  const navDiv = document.querySelector<HTMLDivElement>('#head')!
  if (navDiv) {
    navDiv.innerHTML = navHeader + navResearch;
  }
}
