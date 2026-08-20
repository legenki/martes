// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
export const rnd = (min, max) => Math.random() * (max - min) + min;
export const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const map = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));

// Monotonic ID counter for SVG defs (filter, gradient, clipPath, …).
// Replaces `Date.now()` which collides on rapid re-renders.
let _uidCounter = 0;
export function uid(prefix) { return prefix + '-' + (++_uidCounter); }

export function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return [r, g, b];
}

export function rgbToHex(r,g,b) {
  return '#' + [r,g,b].map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
}

// True when a real DOM is available. api.js is imported in Node for headless
// rendering, where touching `document` at module scope would throw before a
// single generator could run.
export const hasDOM = typeof document !== 'undefined';

// Parse any CSS color string to [r,g,b] via canvas (one cached 1x1 context,
// created on first use so importing this module never requires a DOM).
let _colorCtx;
export function parseColor(color) {
  if (_colorCtx === undefined) {
    if (!hasDOM) { _colorCtx = null; }
    else {
      const cvs = document.createElement('canvas');
      cvs.width = cvs.height = 1;
      _colorCtx = cvs.getContext('2d');
    }
  }
  if (!_colorCtx) return [0, 0, 0];
  _colorCtx.clearRect(0, 0, 1, 1);
  _colorCtx.fillStyle = color || '#000000';
  _colorCtx.fillRect(0, 0, 1, 1);
  const d = _colorCtx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

// ── The one colour normaliser ──────────────────────────────────
// Every colour that reaches state, a swatch, or a palette goes through
// here. `<input type="color">` accepts *only* `#rrggbb`; handed anything
// else it silently shows #000000 while the canvas draws the real colour,
// so the swatch and the artwork disagree. Normalising on the way in keeps
// the two in sync no matter what a generator declares as its default.
//
// `fallback` is returned for values that are valid SVG paint but not a
// displayable colour ('none', 'transparent') or that fail to parse.
export function toHex(color, fallback = '#000000') {
  if (color == null) return fallback;
  const c = String(color).trim().toLowerCase();
  if (c === '' || c === 'none' || c === 'transparent') return fallback;
  if (/^#[0-9a-f]{6}$/.test(c)) return c;
  if (/^#[0-9a-f]{3}$/.test(c)) return '#' + [...c.slice(1)].map(ch => ch + ch).join('');

  // hsl()/hsla() parsed directly rather than via canvas — generators declare
  // a lot of hsl defaults, and this keeps the conversion exact and testable
  // instead of depending on a 2D context being available.
  const hsl = /^hsla?\(\s*([-\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%/.exec(c);
  if (hsl) {
    const h = ((parseFloat(hsl[1]) % 360) + 360) % 360;
    const sat = clamp(parseFloat(hsl[2]) / 100, 0, 1);
    const li = clamp(parseFloat(hsl[3]) / 100, 0, 1);
    const k = n => (n + h / 30) % 12;
    const a = sat * Math.min(li, 1 - li);
    const f = n => li - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
  }

  const rgb = /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/.exec(c);
  if (rgb) return rgbToHex(+rgb[1], +rgb[2], +rgb[3]);

  // Anything left (named colours, lab(), colour keywords) goes through the
  // browser's own parser.
  const [r, g, b] = parseColor(c);
  // parseColor leaves the pixel untouched for input the browser rejects, so a
  // black result is only trustworthy when the input really did name black.
  if (r === 0 && g === 0 && b === 0 && !/^(black|#000000|#000)$/.test(c)) return fallback;
  return rgbToHex(r, g, b);
}

export function lerpColor(c1, c2, t) {
  const a = parseColor(c1), b = parseColor(c2);
  return rgbToHex(lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t));
}

// Cubic bezier point
export function cubicBez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
}

// ═══════════════════════════════════════════════════════════════
// CANVAS STATE
// ═══════════════════════════════════════════════════════════════
export const RATIOS = {
  '2:3': [600, 900],   // default — portrait card / cover
  '1:1': [900, 900],
};

export let canvasW = 600, canvasH = 900;
export let currentTool = null;
export function setCurrentTool(t) { currentTool = t; }
export const toolState = {};

export const svg = hasDOM ? document.getElementById('svgCanvas') : null;
export const canvasArea = hasDOM ? document.getElementById('canvasArea') : null;
// Imported `let` bindings are read-only in the importing module, so canvas
// size changes have to come back through here.
export function setCanvasSize(w, h) {
  canvasW = w; canvasH = h;
  resizeCanvas();
}

export function resizeCanvas() {
  if (!svg) return;
  svg.setAttribute('width', canvasW);
  svg.setAttribute('height', canvasH);
  svg.setAttribute('viewBox', `0 0 ${canvasW} ${canvasH}`);
  fitCanvas();
}

export function fitCanvas() {
  if (!svg || !canvasArea) return;
  // 32px padding inside the canvas wrapper, but never below 0 on tiny screens.
  const aW = Math.max(0, canvasArea.clientWidth  - 32);
  const aH = Math.max(0, canvasArea.clientHeight - 32);
  const scale = Math.min(aW / canvasW, aH / canvasH, 1);
  svg.style.width  = Math.round(canvasW * scale) + 'px';
  svg.style.height = Math.round(canvasH * scale) + 'px';
}

if (hasDOM) window.addEventListener('resize', fitCanvas);

// ═══════════════════════════════════════════════════════════════
// CLEAR & RENDER
// ═══════════════════════════════════════════════════════════════
export function clearSVG() {
  if (svg) svg.replaceChildren();
}

export function renderTool() {
  if (!currentTool) return;
  clearSVG();
  try {
    currentTool.render(svg, canvasW, canvasH, getState());
  } catch (e) {
    // Surface generator failures instead of leaving a blank canvas.
    console.error(`[martes] "${currentTool.slug}" failed to render:`, e);
  }
}

export function getState() {
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
if (hasDOM) document.querySelectorAll('.tab-btn').forEach(btn => {
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
  if (!hasDOM) return;
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

  // Close sidebar when a tool is selected (on mobile).
  // Guard against re-ordered <script> tags that might run this IIFE
  // before #toolList is in the DOM.
  const toolList = document.getElementById('toolList');
  if (toolList) {
    toolList.addEventListener('click', (e) => {
      if (e.target.closest('.tool-btn') && window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  }
})();


// ═══════════════════════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════════════════════
(function initThemeToggle() {
  if (!hasDOM) return;
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('martes-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('martes-theme', 'light');
    }
  });
})();
