// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
const rnd = (min, max) => Math.random() * (max - min) + min;
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;
const map = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));

// Monotonic ID counter for SVG defs (filter, gradient, clipPath, …).
// Replaces `Date.now()` which collides on rapid re-renders.
let _uidCounter = 0;
function uid(prefix) { return prefix + '-' + (++_uidCounter); }

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return [r, g, b];
}

function rgbToHex(r,g,b) {
  return '#' + [r,g,b].map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
}

// Parse any CSS color string to [r,g,b] via canvas (single cached instance)
const _colorCvs = document.createElement('canvas');
_colorCvs.width = _colorCvs.height = 1;
const _colorCtx = _colorCvs.getContext('2d');
function parseColor(color) {
  _colorCtx.clearRect(0, 0, 1, 1);
  _colorCtx.fillStyle = color || '#000000';
  _colorCtx.fillRect(0, 0, 1, 1);
  const d = _colorCtx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

function lerpColor(c1, c2, t) {
  const a = parseColor(c1), b = parseColor(c2);
  return rgbToHex(lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t));
}

// Cubic bezier point
function cubicBez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
}

// ═══════════════════════════════════════════════════════════════
// CANVAS STATE
// ═══════════════════════════════════════════════════════════════
const RATIOS = {
  '2:3': [600, 900],   // default — portrait card / cover
  '1:1': [900, 900],
};

let canvasW = 600, canvasH = 900;
let currentTool = null;
const toolState = {};

const svg = document.getElementById('svgCanvas');
const canvasArea = document.getElementById('canvasArea');
function resizeCanvas() {
  svg.setAttribute('width', canvasW);
  svg.setAttribute('height', canvasH);
  svg.setAttribute('viewBox', `0 0 ${canvasW} ${canvasH}`);
  fitCanvas();
}

function fitCanvas() {
  // 32px padding inside the canvas wrapper, but never below 0 on tiny screens.
  const aW = Math.max(0, canvasArea.clientWidth  - 32);
  const aH = Math.max(0, canvasArea.clientHeight - 32);
  const scale = Math.min(aW / canvasW, aH / canvasH, 1);
  svg.style.width  = Math.round(canvasW * scale) + 'px';
  svg.style.height = Math.round(canvasH * scale) + 'px';
}

window.addEventListener('resize', fitCanvas);

// ═══════════════════════════════════════════════════════════════
// CLEAR & RENDER
// ═══════════════════════════════════════════════════════════════
function clearSVG() {
  svg.replaceChildren();
}

function renderTool() {
  if (!currentTool) return;
  clearSVG();
  currentTool.render(svg, canvasW, canvasH, getState());
}

function getState() {
  if (!currentTool) return {};
  const slug = currentTool.slug;
  if (!toolState[slug]) toolState[slug] = {};
  const s = toolState[slug];
  // Fill in any missing defaults — palette pre-fill may have created
  // the object with only colour slots set; non-colour controls (range,
  // toggle, btngroup, …) still need their defaults.
  (currentTool.controls || []).forEach(c => {
    if (s[c.id] === undefined) s[c.id] = c.default;
  });
  return s;
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING (tools / textures)
// ═══════════════════════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('tab-' + btn.dataset.tab);
    panel.classList.add('active');
    if (btn.dataset.tab === 'tools') setTimeout(fitCanvas, 50);
    if (btn.dataset.tab === 'textures' && window.initTexturesGrid) {
      window.initTexturesGrid();
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// SIDEBAR TOGGLE (responsive hamburger menu)
// ═══════════════════════════════════════════════════════════════
(function initSidebarToggle() {
  const toggle   = document.getElementById('sidebarToggle');
  const sidebar  = document.getElementById('sidebarEl');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!toggle || !sidebar) return;

  // a11y: link toggle to the sidebar it controls.
  toggle.setAttribute('aria-controls', 'sidebarEl');
  toggle.setAttribute('aria-expanded', 'false');

  function openSidebar() {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  if (backdrop) {
    // Make backdrop keyboard-reachable so screen-reader users can dismiss.
    backdrop.setAttribute('role', 'button');
    backdrop.setAttribute('tabindex', '0');
    backdrop.setAttribute('aria-label', 'Close sidebar');
    backdrop.addEventListener('click', closeSidebar);
    backdrop.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeSidebar(); }
    });
  }

  // Escape closes the drawer when open.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
  });

  // Close sidebar when a tool is selected (on mobile)
  document.getElementById('toolList').addEventListener('click', (e) => {
    if (e.target.closest('.tool-btn') && window.innerWidth <= 1024) {
      closeSidebar();
    }
  });
})();
