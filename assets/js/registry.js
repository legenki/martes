document.title = "REGISTRY RUNNING";
import { setCurrentTool, rndInt, pick, map, RATIOS, canvasW, canvasH, currentTool, toolState, svg, resizeCanvas, renderTool, getState } from './core.js';
import { currentPalette, currentPaletteIndex, applyPaletteToTool, applyPaletteGlobal } from './palettes.js';
import splat from './tools/splat.js';
import dust from './tools/dust.js';
import prism from './tools/prism.js';
import leaf from './tools/leaf.js';
import drift from './tools/drift.js';
import coil from './tools/coil.js';
import wave from './tools/wave.js';
import orbit from './tools/orbit.js';
import vortex from './tools/vortex.js';
import slash from './tools/slash.js';
import mirror from './tools/mirror.js';
import ripple from './tools/ripple.js';
import bloom from './tools/bloom.js';
import flux from './tools/flux.js';
import quartz from './tools/quartz.js';
import haze from './tools/haze.js';
import shine from './tools/shine.js';
import surf from './tools/surf.js';
import scale from './tools/scale.js';
import burst from './tools/burst.js';
import halo from './tools/halo.js';
import whorl from './tools/whorl.js';
import tessera from './tools/tessera.js';
import terrain from './tools/tile/terrain.js';
import symmetry from './tools/tile/symmetry.js';
import bloks from './tools/tile/bloks.js';
import disque from './tools/tile/disque.js';
import trigram from './tools/tile/trigram.js';
import mixtape from './tools/tile/mixtape.js';
import ring from './tools/tile/ring.js';
import blossom from './tools/tile/blossom.js';
import veil from './tools/tile/veil.js';
import radius from './tools/tile/radius.js';
import odessa from './tools/tile/odessa.js';

// ═══════════════════════════════════════════════════════════════
// MARTES — UI registry
//
// TOOLS is filled by every tools/<slug>.js and tools/tile/<slug>.js
// file via TOOLS.push(...). This file owns the rest of the chrome:
// sidebar build, panel build, control widgets, action buttons,
// random/save/copy, and the public window.martesInit() entry.
// ═══════════════════════════════════════════════════════════════
const TOOLS = [
  splat,
  dust,
  prism,
  leaf,
  drift,
  coil,
  wave,
  orbit,
  vortex,
  slash,
  mirror,
  ripple,
  bloom,
  flux,
  quartz,
  haze,
  shine,
  surf,
  scale,
  burst,
  halo,
  whorl,
  tessera,
  terrain,
  symmetry,
  bloks,
  disque,
  trigram,
  mixtape,
  ring,
  blossom,
  veil,
  radius,
  odessa
];


// Shared custom-shape stores. Declared here as globals so registry.js
// helpers can reference them even before burst.js/tessera.js execute.
// Those files use `window.X = window.X || []` to honour what's here.
window.bbburstCustomShapes = window.bbburstCustomShapes || [];
window.mmCustomShapes      = window.mmCustomShapes      || [];

// ═══════════════════════════════════════════════════════════════
// RAF THROTTLE — avoid 60+ re-renders/s when dragging sliders
// ═══════════════════════════════════════════════════════════════
let _renderPending = false;
function scheduleRender() {
  if (_renderPending) return;
  _renderPending = true;
  requestAnimationFrame(() => { _renderPending = false; renderTool(); });
}


// ═══════════════════════════════════════════════════════════════
// DEBOUNCE helper
// ═══════════════════════════════════════════════════════════════
function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}


// ═══════════════════════════════════════════════════════════════
// BUILD SIDEBAR
// ═══════════════════════════════════════════════════════════════
function buildSidebar() {
  const list = document.getElementById('toolList');
  const cats = [...new Set(TOOLS.map(t => t.cat))];
  list.innerHTML = cats.map(cat => {
    const tools = TOOLS.filter(t => t.cat === cat);
    return `<div class="tool-cat">${cat}</div>` +
      tools.map(t => `
        <button class="tool-btn" data-slug="${t.slug}">
          <span class="tool-icon" aria-hidden="true">${t.icon || t.emoji || ''}</span>${t.name}
        </button>`).join('');
  }).join('');

  list.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = TOOLS.find(t => t.slug === btn.dataset.slug);
      if (tool) selectTool(tool);
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// SELECT TOOL
// ═══════════════════════════════════════════════════════════════
function selectTool(tool) { window.myLogs = window.myLogs || []; window.myLogs.push("selectTool: " + tool.slug);
  setCurrentTool(tool);
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.slug === tool.slug));
  document.getElementById('btnRandomize').disabled = false;
  document.getElementById('btnSave').disabled = false;
  document.getElementById('btnExport').disabled = false;
  document.getElementById('btnCopy').disabled = false;
  document.getElementById('btnPng').disabled = false;
  svg.setAttribute('aria-label', `${tool.name} — ${tool.desc || 'generated artwork'}`);
  // If a palette was picked, apply it to this tool's colour slots before
  // building the panel so the swatches reflect it immediately.
  if (typeof currentPalette !== 'undefined' && currentPalette) {
    applyPaletteToTool(tool, currentPalette);
  }
  buildPanel(tool);
  renderTool();
}

// ═══════════════════════════════════════════════════════════════
// BUILD PANEL
// ═══════════════════════════════════════════════════════════════
export function buildPanel(tool) {
  document.getElementById('sec-tool').innerHTML = `
    <div class="tool-card">
      <div class="tool-card-name">
        <span class="tool-icon" aria-hidden="true">${tool.icon || tool.emoji || ''}</span>
        ${tool.name}<span class="tool-tag">SVG</span>
      </div>
      <div class="tool-card-desc">${tool.desc}</div>
    </div>`;

  const s = getState();
  const colorCtrls = tool.controls.filter(c => c.type === 'color');
  const otherCtrls = tool.controls.filter(c => c.type !== 'color');

  let html = '';

  if (colorCtrls.length) {
    html += `
      <div class="p-section">
        <div class="p-sec-head" data-sec="color">COLOR <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
        <div class="p-sec-body" id="sec-color">
          <div class="color-row">
            ${colorCtrls.map(c => `
              <div class="color-item">
                <div class="color-swatch" style="background:${s[c.id]}">
                  <input type="color" value="${s[c.id]}" data-ctrl="${c.id}">
                </div>
                <span class="color-name">${c.label}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  if (otherCtrls.length) {
    html += `
      <div class="p-section">
        <div class="p-sec-head" data-sec="shape">SHAPE <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
        <div class="p-sec-body" id="sec-shape">
          ${otherCtrls.map(c => buildCtrl(c, s)).join('')}
        </div>
      </div>`;
  }

  document.getElementById('dynamicSections').innerHTML = html;
  bindPanelEvents(tool, s);
  bindAccordion();
}

// ── mmmotif shape grid ────────────────────────────────────────
function buildMmShapeGrid(activeIds) {
  const B = '#7b9cff', L = '#b8c8ff', D = '#3a5acc';
  return MM_SHAPES.map(sh => {
    const isActive = activeIds.includes(sh.id);
    const markup = sh.markup(B, L, D);
    return `<button class="mm-shape-btn ${isActive ? 'active' : ''}" data-mmshape="${sh.id}" title="${sh.label}">
      <span class="mm-check">✓</span>
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">${markup}</svg>
      <span>${sh.label}</span>
    </button>`;
  }).join('');
}

function buildMmCustomList() {
  if (mmCustomShapes.length === 0) {
    return `<div style="font-size:0.62rem;color:var(--text-muted);padding:0.2rem 0">No custom shapes yet</div>`;
  }
  return mmCustomShapes.map((sh, i) => `
    <div class="mm-custom-item" data-mmcidx="${i}">
      <div class="mm-custom-item-head">
        <span class="mm-custom-item-label">Custom ${i+1}</span>
        <button class="mm-custom-item-del" data-mmdelcustom="${i}" title="Remove">✕</button>
      </div>
      <textarea class="mm-custom-path" data-mmcustpath="${i}" placeholder="Вставьте SVG код или d= путь">${sh.d || ''}</textarea>
      <div class="mm-custom-hint">Вставьте полный SVG, &lt;path d="…"/&gt;, или просто строку пути. Размер подстраивается автоматически.</div>
    </div>`).join('');
}

function rebuildMmCustomList(s, ctrl) {
  const list = document.getElementById('mmCustomList');
  if (!list) return;
  list.innerHTML = buildMmCustomList();
  bindMmCustomList(s, ctrl);
}

function bindMmCustomList(s, ctrl) {
  const list = document.getElementById('mmCustomList');
  if (!list) return;
  list.querySelectorAll('[data-mmdelcustom]').forEach(btn => {
    btn.addEventListener('click', () => {
      pushUndo();
      const idx = parseInt(btn.dataset.mmdelcustom);
      const removedId = mmCustomShapes[idx].id;
      mmCustomShapes.splice(idx, 1);
      mmCustomShapes.forEach((sh, i) => { sh.id = `mmcustom-${i}`; });
      if (ctrl) {
        s[ctrl.id] = (s[ctrl.id] || []).filter(id => id !== removedId)
          .map(id => { const m = id.match(/^mmcustom-(\d+)$/); if (!m) return id; const n = parseInt(m[1]); return n > idx ? `mmcustom-${n-1}` : id; });
      }
      rebuildMmCustomList(s, ctrl);
      renderTool();
    });
  });
  list.querySelectorAll('[data-mmcustpath]').forEach(ta => {
    // Snapshot on focus so a long editing session is undone in one step.
    ta.addEventListener('focus', () => { pushUndo(); }, { once: false });
    ta.addEventListener('input', () => {
      const idx = parseInt(ta.dataset.mmcustpath);
      if (!mmCustomShapes[idx]) return;
      const parsed = parseSvgShapeInput(ta.value);
      if (parsed) {
        const norm = normalizeSvgPath(parsed.d, parsed.fillRule, 34, 34, 20, 20);
        mmCustomShapes[idx]._parsed = norm; // {d, transform, fillRule}
        mmCustomShapes[idx].d = parsed.d;
        // Rebuild markup fn using normalized transform
        mmCustomShapes[idx].markup = (b) => {
          const fr = norm.fillRule && norm.fillRule !== 'nonzero' ? ` fill-rule="${norm.fillRule}"` : '';
          return `<g transform="${norm.transform}"><path d="${norm.d}"${fr} fill="${b}"/></g>`;
        };
        ta.style.borderColor = '';
      } else if (ta.value.trim()) {
        ta.style.borderColor = 'rgba(255,80,80,0.6)';
      }
      renderTool();
    });
  });
}

// ── bbburst shape SVG previews (viewBox -80 -80 160 160) ─────
function bbShapePreviewSVG(shape) {
  const isStroke = !shape.fill;
  const attrs = isStroke
    ? `fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="currentColor" stroke="none"`;
  if (shape.id === 'circle' || shape.id === 'circle-o') {
    return `<circle cx="0" cy="0" r="60" ${attrs}/>`;
  }
  return `<path d="${shape.d}" ${attrs}/>`;
}

function buildBbShapeGrid(activeIds) {
  return BB_SHAPES.map(sh => {
    const isActive = activeIds.includes(sh.id);
    return `<button class="bb-shape-btn ${isActive ? 'active' : ''}" data-bbshape="${sh.id}" title="${sh.label}">
      <span class="bb-check">✓</span>
      <svg viewBox="-80 -80 160 160" xmlns="http://www.w3.org/2000/svg" style="color:rgba(255,255,255,0.8)">
        ${bbShapePreviewSVG(sh)}
      </svg>
      <span>${sh.label.replace(/^.\s/,'')}</span>
    </button>`;
  }).join('');
}

function buildCustomShapesList() {
  if (bbburstCustomShapes.length === 0) {
    return `<div style="font-size:0.62rem;color:var(--text-muted);padding:0.2rem 0;">No custom shapes yet</div>`;
  }
  return bbburstCustomShapes.map((sh, i) => `
    <div class="bb-custom-item" data-cidx="${i}">
      <div class="bb-custom-item-head">
        <span class="bb-custom-item-label">Custom ${i+1}: ${sh.label || 'shape'}</span>
        <button class="bb-custom-item-del" data-delcustom="${i}" title="Remove">✕</button>
      </div>
      <textarea class="bb-custom-path" data-custpath="${i}" placeholder="Вставьте SVG код или d= путь">${sh.d}</textarea>
      <div class="bb-custom-toggles">
        <label class="bb-custom-lbl">
          <input type="checkbox" data-custstroke="${i}" ${sh.isStroke ? 'checked' : ''}> stroke only
        </label>
        <label class="bb-custom-lbl">
          <input type="checkbox" data-custactive="${i}" ${sh.active ? 'checked' : ''}> active
        </label>
      </div>
    </div>`).join('');
}

// SVG previews for shape picker buttons (viewBox 0 0 100 100, centered)
const SHAPE_PREVIEWS = {
  line:     `<line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
  arrow:    `<polyline points="10,50 78,50" stroke="currentColor" stroke-width="5" stroke-linecap="round" fill="none"/><polyline points="60,32 78,50 60,68" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  star:     `<polygon points="50,12 58,36 83,36 63,52 70,76 50,60 30,76 37,52 17,36 42,36" fill="currentColor"/>`,
  diamond:  `<polygon points="50,10 80,50 50,90 20,50" fill="currentColor"/>`,
  circle:   `<circle cx="50" cy="50" r="33" fill="currentColor"/>`,
  cross:    `<rect x="38" y="12" width="24" height="76" rx="4" fill="currentColor"/><rect x="12" y="38" width="76" height="24" rx="4" fill="currentColor"/>`,
  petal:    `<path d="M50,85 Q65,50 50,15 Q35,50 50,85 Z" fill="currentColor"/>`,
  triangle: `<polygon points="50,12 88,85 12,85" fill="currentColor"/>`,
  hexagon:  `<polygon points="50,10 84,30 84,70 50,90 16,70 16,30" fill="currentColor"/>`,
  dash:     `<rect x="12" y="42" width="76" height="16" rx="8" fill="currentColor"/>`,
  custom:   `<text x="50" y="58" text-anchor="middle" font-size="30" fill="currentColor" font-family="monospace">&lt;/&gt;</text>`,
};

function buildCtrl(c, s) {
  const val = s[c.id];
  if (c.type === 'range') {
    return `<div class="ctrl-row">
      <div class="ctrl-label-row">
        <span class="ctrl-label">${c.label}</span>
        <input type="number" class="ctrl-num-input" id="num-${c.id}" data-ctrl-num="${c.id}" value="${typeof val === 'number' ? (val % 1 === 0 ? val : parseFloat(val.toFixed(3))) : val}" step="${c.step}">
      </div>
      <input type="range" data-ctrl="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${val}">
    </div>`;
  } else if (c.type === 'btngroup') {
    const labels = c.options;
    const vals = c.values || c.options;
    return `<div class="ctrl-row">
      <div class="ctrl-label-row"><span class="ctrl-label">${c.label}</span></div>
      <div class="btn-group">
        ${labels.map((lbl, i) => `
          <button class="btn-opt ${vals[i] === val ? 'active' : ''}" data-ctrl="${c.id}" data-val="${vals[i]}">${lbl}</button>`).join('')}
      </div>
    </div>`;
  } else if (c.type === 'toggle') {
    return `<div class="toggle-row">
      <span class="toggle-label">${c.label}</span>
      <label class="toggle">
        <input type="checkbox" data-ctrl="${c.id}" ${val ? 'checked' : ''}>
        <span class="toggle-track"></span>
      </label>
    </div>`;
  } else if (c.type === 'bbshapes') {
    const activeIds = Array.isArray(s[c.id]) ? s[c.id] : c.default;
    return `<div class="ctrl-row" id="bbshapes-ctrl">
      <div class="ctrl-label-row"><span class="ctrl-label">${c.label} <span style="color:var(--accent);font-size:0.6rem">(click to toggle)</span></span></div>
      <div class="bb-shape-grid" id="bbShapeGrid">
        ${buildBbShapeGrid(activeIds)}
      </div>
      <div class="bb-custom-shapes">
        <div class="bb-custom-head">
          <span class="bb-custom-title">Custom shapes (up to 10)</span>
          <button class="bb-add-btn" id="bbAddCustom">+ Add</button>
        </div>
        <div class="bb-custom-list" id="bbCustomList">
          ${buildCustomShapesList()}
        </div>
      </div>
    </div>`;
  } else if (c.type === 'mmshapes') {
    const activeIds = Array.isArray(s[c.id]) ? s[c.id] : c.default;
    return `<div class="ctrl-row" id="mmshapes-ctrl">
      <div class="ctrl-label-row"><span class="ctrl-label">${c.label} <span style="color:var(--accent);font-size:0.6rem">(click to toggle)</span></span></div>
      <div class="mm-shape-grid" id="mmShapeGrid">
        ${buildMmShapeGrid(activeIds)}
      </div>
      <div class="mm-custom-shapes">
        <div class="mm-custom-head">
          <span class="mm-custom-title">Custom shapes (up to 10)</span>
          <button class="mm-add-btn" id="mmAddCustom">+ Add</button>
        </div>
        <div class="mm-custom-list" id="mmCustomList">
          ${buildMmCustomList()}
        </div>
      </div>
    </div>`;
  } else if (c.type === 'svgshape') {
    const keys = Object.keys(SHAPE_PREVIEWS);
    const customPath = s.customPath || '';
    const isCustom = val === 'custom';
    return `<div class="ctrl-row" data-shapepicker="${c.id}">
      <div class="ctrl-label-row"><span class="ctrl-label">${c.label}</span></div>
      <div class="shape-picker">
        ${keys.map(k => `
          <button class="shape-pick-btn ${val === k ? 'active' : ''}" data-shapeval="${k}" title="${k}">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="color:rgba(255,255,255,0.75)">
              ${SHAPE_PREVIEWS[k]}
            </svg>
          </button>`).join('')}
      </div>
      <div class="shape-custom-area" style="${isCustom ? '' : 'display:none'}">
        <span class="shape-custom-label">SVG path d= (centered at 0,0)</span>
        <textarea class="shape-custom-input" id="customPathInput" placeholder="M 0 0 L 80 0 M 55 -18 L 80 0 L 55 18">${customPath}</textarea>
        <div class="shape-custom-hint">Use SVG path commands. Shape is centered at origin (0,0). Scale is controlled by Min/Max scale sliders.</div>
      </div>
    </div>`;
  }
  return '';
}

function rebuildBbCustomList(s, bbCtrl) {
  const list = document.getElementById('bbCustomList');
  if (!list) return;
  list.innerHTML = buildCustomShapesList();
  bindBbCustomList(s, bbCtrl);
}

function bindBbCustomList(s, bbCtrl) {
  const list = document.getElementById('bbCustomList');
  if (!list) return;

  // Delete buttons
  list.querySelectorAll('[data-delcustom]').forEach(btn => {
    btn.addEventListener('click', () => {
      pushUndo();
      const idx = parseInt(btn.dataset.delcustom);
      const removedId = bbburstCustomShapes[idx].id;
      bbburstCustomShapes.splice(idx, 1);
      // Re-index remaining custom shapes
      bbburstCustomShapes.forEach((sh, i) => { sh.id = `custom-${i}`; sh.label = `Custom ${i+1}`; });
      if (bbCtrl) {
        s[bbCtrl.id] = (s[bbCtrl.id] || []).filter(id => id !== removedId)
          .map(id => {
            const m = id.match(/^custom-(\d+)$/);
            if (!m) return id;
            const n = parseInt(m[1]);
            return n > idx ? `custom-${n-1}` : id;
          });
      }
      rebuildBbCustomList(s, bbCtrl);
      renderTool();
    });
  });

  // Path textarea — snapshot once on focus to undo whole edit session.
  list.querySelectorAll('[data-custpath]').forEach(ta => {
    ta.addEventListener('focus', () => { pushUndo(); });
    ta.addEventListener('input', () => {
      const idx = parseInt(ta.dataset.custpath);
      if (!bbburstCustomShapes[idx]) return;
      const parsed = parseSvgShapeInput(ta.value);
      if (parsed) {
        // bbburst shapes are centered at 0,0 in ±72 space
        const norm = normalizeSvgPath(parsed.d, parsed.fillRule, 130, 130, 0, 0);
        bbburstCustomShapes[idx]._parsed = norm;
        bbburstCustomShapes[idx].d = norm.transform
          ? `<path d="${norm.d}" fill-rule="${norm.fillRule||'nonzero'}" transform="${norm.transform}"/>`
          : norm.d;
        // Store raw d for rendering via <g transform>
        bbburstCustomShapes[idx]._normD = norm.d;
        bbburstCustomShapes[idx]._normTransform = norm.transform;
        bbburstCustomShapes[idx]._fillRule = norm.fillRule;
        ta.style.borderColor = '';
      } else if (ta.value.trim()) {
        ta.style.borderColor = 'rgba(255,80,80,0.6)';
      }
      renderTool();
    });
  });

  // Stroke toggle
  list.querySelectorAll('[data-custstroke]').forEach(cb => {
    cb.addEventListener('change', () => {
      pushUndo();
      const idx = parseInt(cb.dataset.custstroke);
      if (bbburstCustomShapes[idx]) {
        bbburstCustomShapes[idx].isStroke = cb.checked;
        bbburstCustomShapes[idx].fill = !cb.checked;
      }
      renderTool();
    });
  });

  // Active toggle
  list.querySelectorAll('[data-custactive]').forEach(cb => {
    cb.addEventListener('change', () => {
      pushUndo();
      const idx = parseInt(cb.dataset.custactive);
      if (!bbburstCustomShapes[idx]) return;
      bbburstCustomShapes[idx].active = cb.checked;
      if (bbCtrl) {
        const id = `custom-${idx}`;
        let active = Array.isArray(s[bbCtrl.id]) ? [...s[bbCtrl.id]] : [];
        if (cb.checked && !active.includes(id)) active.push(id);
        else if (!cb.checked) active = active.filter(a => a !== id);
        s[bbCtrl.id] = active;
      }
      renderTool();
    });
  });
}

function bindPanelEvents(tool, s) {
  // Scope to the panel — otherwise any future `data-ctrl` element
  // outside #dynamicSections (e.g. in another tab) would also bind.
  const scope = document.getElementById('dynamicSections') || document;
  scope.querySelectorAll('[data-ctrl]').forEach(el => {
    const id = el.dataset.ctrl;
    if (el.type === 'color') {
      el.addEventListener('input', () => {
        pushUndo();
        s[id] = el.value;
        el.closest('.color-swatch').style.background = el.value;
        scheduleRender();
      });
    } else if (el.type === 'range') {
      el.addEventListener('pointerdown', () => { pushUndo(); });
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        s[id] = v;
        const numInput = document.getElementById('num-' + id);
        if (numInput) numInput.value = v % 1 === 0 ? v : parseFloat(v.toFixed(3));
        scheduleRender();
      });
      // Keyboard arrows on focused slider (no pointerdown) — capture once via change.
      let _kbSnap = false;
      el.addEventListener('keydown', () => { if (!_kbSnap) { pushUndo(); _kbSnap = true; } });
      el.addEventListener('blur',    () => { _kbSnap = false; });
    } else if (el.type === 'checkbox') {
      el.addEventListener('change', () => { pushUndo(); s[id] = el.checked; scheduleRender(); });
    } else if (el.classList.contains('btn-opt')) {
      el.addEventListener('click', () => {
        pushUndo();
        s[id] = el.dataset.val;
        document.querySelectorAll(`.btn-opt[data-ctrl="${id}"]`).forEach(b => b.classList.toggle('active', b.dataset.val === el.dataset.val));
        scheduleRender();
      });
    }
  });

  
  scope.querySelectorAll('.ctrl-num-input').forEach(el => {
    const id = el.dataset.ctrlNum;
    el.addEventListener('focus', () => { pushUndo(); });
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      if (isNaN(v)) return;
      s[id] = v;
      const slider = document.querySelector(`input[type="range"][data-ctrl="${id}"]`);
      if (slider) slider.value = v;
      scheduleRender();
    });
  });

  // ── bbburst multi-shape picker ─────────────────────────────
  const bbGrid = document.getElementById('bbShapeGrid');
  if (bbGrid && currentTool && currentTool.slug === 'burst') {
    const bbCtrl = currentTool.controls.find(c => c.type === 'bbshapes');
    if (bbCtrl) {
      bbGrid.querySelectorAll('.bb-shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          pushUndo();
          const shapeId = btn.dataset.bbshape;
          let active = Array.isArray(s[bbCtrl.id]) ? [...s[bbCtrl.id]] : [...bbCtrl.default];
          if (active.includes(shapeId)) {
            if (active.length > 1) active = active.filter(id => id !== shapeId);
          } else {
            active.push(shapeId);
          }
          s[bbCtrl.id] = active;
          bbGrid.querySelectorAll('.bb-shape-btn').forEach(b => {
            b.classList.toggle('active', active.includes(b.dataset.bbshape));
          });
          renderTool();
        });
      });
    }

    // Add custom shape
    const addBtn = document.getElementById('bbAddCustom');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (bbburstCustomShapes.length >= 10) return;
        pushUndo();
        const idx = bbburstCustomShapes.length;
        bbburstCustomShapes.push({ id:`custom-${idx}`, label:`Custom ${idx+1}`, d:'', fill:true, isCustom:true, isStroke:false, active:true });
        // sync active shapes
        if (bbCtrl) {
          let active = Array.isArray(s[bbCtrl.id]) ? [...s[bbCtrl.id]] : [...bbCtrl.default];
          active.push(`custom-${idx}`);
          s[bbCtrl.id] = active;
        }
        rebuildBbCustomList(s, bbCtrl);
        renderTool();
      });
    }

    bindBbCustomList(s, bbCtrl);
  }

  // ── mmmotif shape picker ────────────────────────────────────
  const mmGrid = document.getElementById('mmShapeGrid');
  if (mmGrid && currentTool && currentTool.slug === 'tessera') {
    const mmCtrl = currentTool.controls.find(c => c.type === 'mmshapes');
    if (mmCtrl) {
      mmGrid.querySelectorAll('.mm-shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          pushUndo();
          const shapeId = parseInt(btn.dataset.mmshape);
          let active = Array.isArray(s[mmCtrl.id]) ? [...s[mmCtrl.id]] : [...mmCtrl.default];
          if (active.includes(shapeId)) {
            if (active.length > 1) active = active.filter(id => id !== shapeId);
          } else {
            active.push(shapeId);
          }
          s[mmCtrl.id] = active;
          mmGrid.querySelectorAll('.mm-shape-btn').forEach(b => {
            b.classList.toggle('active', active.includes(parseInt(b.dataset.mmshape)));
          });
          renderTool();
        });
      });
    }

    const mmAddBtn = document.getElementById('mmAddCustom');
    if (mmAddBtn) {
      mmAddBtn.addEventListener('click', () => {
        if (mmCustomShapes.length >= 10) return;
        pushUndo();
        const idx = mmCustomShapes.length;
        // Capture id in closure (not idx) so reordering by splice doesn't
        // make markup-fn reference the wrong slot.
        const shapeId = `mmcustom-${idx}`;
        mmCustomShapes.push({
          id: shapeId, label:`Custom ${idx+1}`, d:'', isCustom:true,
          markup: function(b) {
            const sh = mmCustomShapes.find(x => x.id === this.id);
            return `<path d="${sh?.d || ''}" fill="${b}"/>`;
          }
        });
        // Bind `this` in markup to the shape object we just pushed.
        mmCustomShapes[idx].markup = mmCustomShapes[idx].markup.bind(mmCustomShapes[idx]);
        if (mmCtrl) {
          let active = Array.isArray(s[mmCtrl.id]) ? [...s[mmCtrl.id]] : [...mmCtrl.default];
          active.push(shapeId);
          s[mmCtrl.id] = active;
        }
        rebuildMmCustomList(s, mmCtrl);
        renderTool();
      });
    }

    bindMmCustomList(s, mmCtrl);
  }

  // SVG shape picker — same scope as data-ctrl above.
  scope.querySelectorAll('[data-shapepicker]').forEach(picker => {
    const ctrlId = picker.dataset.shapepicker;
    picker.querySelectorAll('.shape-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pushUndo();
        const val = btn.dataset.shapeval;
        s[ctrlId] = val;
        picker.querySelectorAll('.shape-pick-btn').forEach(b => b.classList.toggle('active', b.dataset.shapeval === val));
        const customArea = picker.querySelector('.shape-custom-area');
        if (customArea) customArea.style.display = val === 'custom' ? '' : 'none';
        renderTool();
      });
    });
    const textarea = picker.querySelector('.shape-custom-input');
    if (textarea) {
      textarea.addEventListener('focus', () => { pushUndo(); });
      textarea.addEventListener('input', () => {
        s.customPath = textarea.value;
        textarea.classList.toggle('error', textarea.value.trim() !== '' && !/^[mMlLhHvVcCsSqQtTaAzZ]/.test(textarea.value.trim()));
        renderTool();
      });
    }
  });
}

function bindAccordion() {
  document.querySelectorAll('.p-sec-head[data-sec]').forEach(h => {
    // Remove old listeners by cloning
    const fresh = h.cloneNode(true);
    h.parentNode.replaceChild(fresh, h);
    fresh.addEventListener('click', () => {
      const body = document.getElementById('sec-' + fresh.dataset.sec);
      if (body) { fresh.classList.toggle('collapsed'); body.classList.toggle('hidden'); }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// CANVAS RATIO
// ═══════════════════════════════════════════════════════════════
document.getElementById('ratioSelect').addEventListener('change', function() {
  pushUndo();
  [canvasW, canvasH] = RATIOS[this.value];
  // Persist on the per-tool state so undo can restore it alongside the rest.
  if (currentTool) {
    const s = toolState[currentTool.slug] || (toolState[currentTool.slug] = {});
    s._ratio = this.value;
  }
  resizeCanvas();
  renderTool();
});


function martesInit() { document.title="INIT START"; try {
  buildSidebar();
  resizeCanvas();
  selectTool(TOOLS[0]); document.title="TOOLS: " + TOOLS.length;
} catch(e) { document.title = "ERR: " + e.message; } };

// Initialize everything
martesInit();
console.log('REGISTRY LOADED');
window.DEBUG_TOOLS = TOOLS;
