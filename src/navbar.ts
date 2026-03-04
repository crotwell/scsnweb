
import scLogo from '/usc_logo_horizontal_rgb_g_rev.svg'

let navHeader = `
<header>
  <div class="uscLogo">
    <a href="https://sc.edu">
      <img src="${scLogo}" class="logo" alt="USC logo" />
    </a>
    <div class="seoe">
      <div class="seoeLogo"><a href="https://seoe.sc.edu">
      School of Earth, Ocean and Environment</a></div>
      <div class="seoeLogo"><a href="${import.meta.env.BASE_URL}index.html">
      Seismology at USC</a></div>
    </div>
  </div>
  <div class="scsnLogo">
    <span id="areatitle"><a href="${import.meta.env.BASE_URL}index.html">South Carolina Seismic Network</a></span>
    <span id="nav"></span>
  </div>
</header>
`;

let navMain = `
<nav class="sidebar">
  <ul>
    <li><a href="${import.meta.env.BASE_URL}outreach/index.html">Public</a></li>
    <li><a href="${import.meta.env.BASE_URL}research/index.html">Research</a></li>
  </ul>
</nav>
`;
let navPublic = `
<nav class="sidebar">
  <ul>
    <li><a href="${import.meta.env.BASE_URL}scquakes/index.html">Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}helicorder/index.html">Today's Seismograms</a></li>
    <li><a href="${import.meta.env.BASE_URL}historical/index.html">Historical Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}global/index.html">Global Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}about/index.html">About</a></li>
  </ul>
</nav>
`;

let navResearch = `
<nav class="sidebar">
  <ul>
    <li><a href="https://eeyore.seis.sc.edu/scsn/status">SCSNStatus</a></li>
    <li><a href="${import.meta.env.BASE_URL}software/index.html">Software</a></li>
    <li><a href="${import.meta.env.BASE_URL}contact/index.html">Contact</a></li>
  </ul>
</nav>
`;

export function createMainNavigation() {
  const navDiv = document.querySelector<HTMLDivElement>('#head')!
  if (navDiv) {
    navDiv.innerHTML = navHeader;
  }
  const innerNav = document.querySelector<HTMLDivElement>('#nav')!
  if (innerNav) {
    innerNav.innerHTML = navMain;
  }
}

export function createPublicNavigation() {
  const navDiv = document.querySelector<HTMLDivElement>('#head')!
  if (navDiv) {
    navDiv.innerHTML = navHeader;
  }
  const areatitle = document.querySelector<HTMLSpanElement>('#areatitle')!
  if (areatitle) {
    areatitle.innerHTML = `<a href="${import.meta.env.BASE_URL}index.html">South Carolina Seismic Network</a>`;
  }
  const innerNav = document.querySelector<HTMLDivElement>('#nav')!
  if (innerNav) {
    innerNav.innerHTML = navPublic;
  }
}

export function createResearchNavigation() {
  const navDiv = document.querySelector<HTMLDivElement>('#head')!
  if (navDiv) {
    navDiv.innerHTML = navHeader;
  }
  const areatitle = document.querySelector<HTMLSpanElement>('#areatitle')!
  if (areatitle) {
    areatitle.innerHTML = `<a href="${import.meta.env.BASE_URL}research/index.html">Research</a>`;
  }
  const innerNav = document.querySelector<HTMLDivElement>('#nav')!
  if (innerNav) {
    innerNav.innerHTML = navResearch;
  }
}
