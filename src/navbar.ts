
import scLogo from '/usc_logo_horizontal_rgb_g_rev.svg'

let navhtml = `
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
<nav class="sidebar">
  <ul>
    <li><a href="${import.meta.env.BASE_URL}index.html">Home</a></li>
    <li><a href="${import.meta.env.BASE_URL}about/index.html">About</a></li>
    <li><a href="${import.meta.env.BASE_URL}contact/index.html">Contact</a></li>
  </ul>
</nav>
`;

export function createNavigation() {
  const navDiv = document.querySelector<HTMLDivElement>('#nav')!
  if (navDiv) {
    navDiv.innerHTML = navhtml;
  }
}
