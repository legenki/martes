import { pushUndoGlobal, applyStateSnap } from './history.js';
import { buildPanel, TOOLS } from './registry.js';
import { uid, svgEl, hexToRgb, rgbToHex, parseColor, lerpColor, cubicBez, toolState, renderTool, getState, currentTool, pick, toHex } from './core.js';
export { NICE_PALETTES, applyPaletteToTool } from './palettes.data.js';
import { NICE_PALETTES, applyPaletteToTool } from './palettes.data.js';

// ═══════════════════════════════════════════════════════════════
// PALETTE STATE — shared across all tools in this session
// ═══════════════════════════════════════════════════════════════
// null = no palette applied yet; tools use their own defaults.
// Once a palette is picked it becomes `currentPalette` and gets applied
// to every tool the user switches to.
export let currentPalette = null;
export let currentPaletteIndex = -1;

// Same read-only-binding rule as the canvas size: history.js restores a
// palette snapshot and needs a setter to write back into this module.
export function setCurrentPalette(palette, index = -1) {
  currentPalette = palette;
  currentPaletteIndex = palette ? index : -1;
}

// Apply `palette` (array of up to 5 hex strings) to a tool's state by
// overwriting the first N color-typed controls. Returns true if any
// slot was changed.

// Apply a palette to EVERY registered tool's state (so a later switch already
// has palette colours pre-loaded), and refresh the current panel + canvas.
//
// Accepts either a palette array or an index into NICE_PALETTES — doImportJSON
// restores a stored index while the dropdown passes the array itself, and both
// must land in the same place.
export function applyPaletteGlobal(palette, paletteIndex = -1) {
  if (typeof palette === 'number') {
    paletteIndex = palette;
    palette = NICE_PALETTES[paletteIndex] || null;
  }
  currentPalette = palette;
  currentPaletteIndex = palette ? paletteIndex : -1;
  if (!palette) return;
  TOOLS.forEach(t => applyPaletteToTool(t, palette));
  // buildPanel is imported directly; the old `window.buildPanel` guard was
  // never true, so the panel and canvas silently never refreshed.
  if (currentTool) {
    buildPanel(currentTool);
    renderTool();
  }
}

// ═══════════════════════════════════════════════════════════════
// DROPDOWN UI
// ═══════════════════════════════════════════════════════════════
(function initPaletteDropdown() {
  const root      = document.getElementById('paletteDropdown');
  const button    = document.getElementById('paletteDropdownBtn');
  const panel     = document.getElementById('paletteDropdownPanel');
  const search    = document.getElementById('paletteSearch');
  const list      = document.getElementById('paletteList');
  const swatchEl  = document.getElementById('paletteDropdownSwatches');
  const labelEl   = document.getElementById('paletteDropdownLabel');
  if (!root || !button || !panel || !list) return;

  // Render the 5-swatch preview in the button.
  function paintButton(palette, label) {
    swatchEl.innerHTML = '';
    const colours = palette || ['#fafafa','#f4f4f4','#e5e5e5','#d4d4d4','#a3a3a3'];
    colours.slice(0, 5).forEach(c => {
      const i = document.createElement('i');
      i.style.background = c;
      swatchEl.appendChild(i);
    });
    labelEl.textContent = label;
  }
  paintButton(null, 'Default colours');

  // Build full list once.
  function paletteRowHtml(palette, idx) {
    const swatches = palette.map(c => `<i style="background:${c}"></i>`).join('');
    const selected = idx === currentPaletteIndex ? 'true' : 'false';
    return `<div class="palette-row" role="option" tabindex="-1" aria-selected="${selected}" data-idx="${idx}">
      <span class="palette-row-swatches">${swatches}</span>
      <span class="palette-row-num">${String(idx + 1).padStart(3, '0')}</span>
    </div>`;
  }
  function renderList(filter) {
    const q = (filter || '').trim().toLowerCase();
    const matches = NICE_PALETTES
      .map((p, i) => ({ p, i }))
      .filter(({ p, i }) => {
        if (!q) return true;
        // Match by 1-based index or by any colour hex (case-insensitive substring).
        if (String(i + 1).padStart(3, '0').includes(q)) return true;
        if (String(i + 1).includes(q)) return true;
        return p.some(c => c.toLowerCase().includes(q));
      });
    if (matches.length === 0) {
      list.innerHTML = `<div class="palette-empty">No matches</div>`;
      return;
    }
    list.innerHTML = matches.map(({ p, i }) => paletteRowHtml(p, i)).join('');
    list.querySelectorAll('.palette-row').forEach(row => {
      const idx = parseInt(row.dataset.idx, 10);
      if (idx === currentPaletteIndex) row.classList.add('active');
      row.addEventListener('click', () => {
        choose(idx);
      });
    });
  }
  renderList('');

  // Keyboard navigation within the dropdown — pure listbox pattern.
  // Focus stays on the search input; arrow keys highlight a row via .focused.
  function focusedRow() { return list.querySelector('.palette-row.focused'); }
  function setFocused(row) {
    list.querySelectorAll('.palette-row.focused').forEach(r => r.classList.remove('focused'));
    if (row) {
      row.classList.add('focused');
      row.scrollIntoView({ block: 'nearest' });
      search.setAttribute('aria-activedescendant', row.id || (row.id = 'palette-row-' + row.dataset.idx));
    } else {
      search.removeAttribute('aria-activedescendant');
    }
  }
  function moveFocus(delta) {
    const rows = [...list.querySelectorAll('.palette-row')];
    if (!rows.length) return;
    const cur = focusedRow();
    let idx = cur ? rows.indexOf(cur) : -1;
    idx = Math.max(0, Math.min(rows.length - 1, idx + delta));
    setFocused(rows[idx]);
  }

  function choose(idx) {
    const palette = NICE_PALETTES[idx];
    if (!palette) return;
    // pushUndoGlobal snapshots ALL tools' state + the palette itself, so
    // a later Ctrl+Z restores colours across every tool, not just the
    // active one (palette is a global change).
    if (typeof pushUndoGlobal === 'function') pushUndoGlobal();
    applyPaletteGlobal(palette, idx);
    paintButton(palette, `Palette ${String(idx + 1).padStart(3, '0')}`);
    list.querySelectorAll('.palette-row').forEach(r => {
      r.classList.toggle('active', parseInt(r.dataset.idx, 10) === idx);
    });
    close();
  }

  // Expose so registry.js applyStateSnap() can refresh the button label
  // after an undo/redo that restores a different palette.
  window._refreshPaletteButton = function() {
    if (typeof currentPaletteIndex !== 'undefined' && currentPaletteIndex >= 0 && NICE_PALETTES[currentPaletteIndex]) {
      paintButton(NICE_PALETTES[currentPaletteIndex],
                  `Palette ${String(currentPaletteIndex + 1).padStart(3, '0')}`);
    } else {
      paintButton(null, 'Default colours');
    }
    list.querySelectorAll('.palette-row').forEach(r => {
      r.classList.toggle('active', parseInt(r.dataset.idx, 10) === currentPaletteIndex);
    });
  };

  function open()  { root.classList.add('open');    button.setAttribute('aria-expanded', 'true');  panel.hidden = false; search.focus(); }
  function close() { root.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); panel.hidden = true;  }
  function toggle() { root.classList.contains('open') ? close() : open(); }

  button.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  search.addEventListener('input', () => renderList(search.value));
  search.addEventListener('keydown', (e) => {
    const rows = list.querySelectorAll('.palette-row');
    switch (e.key) {
      case 'Escape':    close(); break;
      case 'ArrowDown': e.preventDefault(); moveFocus(1); break;
      case 'ArrowUp':   e.preventDefault(); moveFocus(-1); break;
      case 'Home':      e.preventDefault(); if (rows[0])           setFocused(rows[0]); break;
      case 'End':       e.preventDefault(); if (rows.length)       setFocused(rows[rows.length - 1]); break;
      case 'Enter':     e.preventDefault(); {
        const row = focusedRow() || rows[0];
        if (row) choose(parseInt(row.dataset.idx, 10));
        break;
      }
    }
  });
  // Outside-click closes — but skip the work if dropdown isn't even open.
  document.addEventListener('click', (e) => {
    if (!root.classList.contains('open')) return;
    if (!root.contains(e.target)) close();
  });
})();
