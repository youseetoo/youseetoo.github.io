// ===== SHARED COMPONENTS =====
// Injects navigation, footer, and cookie banner into every page

function getBasePath() {
  // Detect if we're in a subdirectory
  const path = window.location.pathname;
  if (path.includes('/applications/')) return '../';
  return '';
}

function getNav(activePage) {
  const b = getBasePath();
  return `
  <nav class="site-nav">
    <div class="nav-inner">
      <a href="${b}index.html" class="nav-logo">
        <svg width="32" height="32" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="4" fill="#0f4c81" opacity="0.15"/><rect x="6" y="6" width="20" height="20" rx="3" fill="#0f4c81" opacity="0.3"/><rect x="10" y="10" width="12" height="12" rx="2" fill="#0f4c81"/></svg>
        openUC2
      </a>
      <button class="nav-toggle" onclick="document.querySelector('.nav-links').classList.toggle('open')">☰</button>
      <ul class="nav-links">
        <li>
          <a href="${b}index.html#how-it-works" ${activePage==='technology'?'class="active"':''}>Technology</a>
        </li>
        <li>
          <a href="#" ${activePage==='products'?'class="active"':''}>Products ▾</a>
          <div class="dropdown-menu">
            <div class="dd-label">For Educators</div>
            <a href="${b}discovery.html">Discovery Line — Educational Kits</a>
            <div class="dd-label" style="margin-top:8px">For Researchers & Professionals</div>
            <a href="${b}frame.html">FRAME — Automated Microscope</a>
            <div class="dd-label" style="margin-top:8px">For Makers & Developers</div>
            <a href="${b}makers.html">Open Platform & Community</a>
          </div>
        </li>
        <li>
          <a href="#" ${activePage==='applications'?'class="active"':''}>Applications ▾</a>
          <div class="dropdown-menu">
            <a href="${b}applications/fluorescence.html">Fluorescence Imaging</a>
            <a href="${b}applications/histology.html">Histology & Slide Scanning</a>
            <a href="${b}applications/livecell.html">Live-Cell & Time-Lapse</a>
            <a href="${b}applications/education.html">Teaching & Workshops</a>
          </div>
        </li>
        <li>
          <a href="${b}configurator.html" ${activePage==='configurator'?'class="active"':''}>Configurator</a>
        </li>
        <li>
          <a href="${b}about.html" ${activePage==='about'?'class="active"':''}>About</a>
        </li>
        <li>
          <a href="${b}contact.html" ${activePage==='contact'?'class="active"':''}>Contact</a>
        </li>
        <li>
          <a href="https://shop.openuc2.com/" class="nav-cta" target="_blank">Shop →</a>
        </li>
      </ul>
    </div>
  </nav>`;
}

function getFooter() {
  const b = getBasePath();
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4>openUC2 GmbH</h4>
          <p>Hans-Knöll-Straße 6<br>07745 Jena, Germany<br><br>
          <a href="mailto:hello@openuc2.com">hello@openuc2.com</a><br>
          Phone: +49 159 0199 9271</p>
        </div>
        <div>
          <h4>Products</h4>
          <a href="${b}discovery.html">Discovery Line</a>
          <a href="${b}frame.html">FRAME Microscope</a>
          <a href="${b}configurator.html">Configurator</a>
          <a href="https://shop.openuc2.com/" target="_blank">Online Shop</a>
        </div>
        <div>
          <h4>Resources</h4>
          <a href="https://docs.openuc2.com/" target="_blank">Documentation</a>
          <a href="https://github.com/openUC2/" target="_blank">GitHub</a>
          <a href="https://openuc2.discourse.group/" target="_blank">Community Forum</a>
          <a href="${b}about.html#publications">Publications</a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="${b}imprint.html">Imprint (Impressum)</a>
          <a href="${b}privacy.html">Privacy Policy (Datenschutz)</a>
          <a href="https://shop.openuc2.com/conditions" target="_blank">Terms & Conditions</a>
          <a href="${b}contact.html">Contact</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} openUC2 GmbH. All rights reserved.</span>
        <span>
          <a href="${b}imprint.html">Impressum</a> · 
          <a href="${b}privacy.html">Datenschutz</a>
        </span>
      </div>
    </div>
  </footer>`;
}

function getCookieBanner() {
  const b = getBasePath();
  return `
  <div class="cookie-banner" id="cookieBanner">
    <div>
      We use cookies to ensure the basic functionality of this website and to improve your experience. 
      For details, see our <a href="${b}privacy.html#cookies">Privacy Policy</a>. 
      You can change your preferences at any time.
    </div>
    <div class="cookie-buttons">
      <button class="btn-essential" onclick="acceptCookies('essential')">Only essential</button>
      <button class="btn-accept" onclick="acceptCookies('all')">Accept all</button>
    </div>
  </div>`;
}

function acceptCookies(level) {
  document.getElementById('cookieBanner').classList.add('hidden');
  // In production, this would set a cookie with the consent level
  // and conditionally load Google Analytics, etc.
  localStorage.setItem('uc2_cookie_consent', level);
  localStorage.setItem('uc2_cookie_date', new Date().toISOString());
}

// Auto-inject on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  const page = document.body.dataset.page || '';
  
  // Inject nav
  const navTarget = document.getElementById('nav-root');
  if (navTarget) navTarget.innerHTML = getNav(page);
  
  // Inject footer
  const footerTarget = document.getElementById('footer-root');
  if (footerTarget) footerTarget.innerHTML = getFooter();
  
  // Inject cookie banner (if not already consented)
  if (!localStorage.getItem('uc2_cookie_consent')) {
    const bannerTarget = document.getElementById('cookie-root');
    if (bannerTarget) bannerTarget.innerHTML = getCookieBanner();
  }
});
