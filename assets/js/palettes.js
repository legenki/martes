const NICE_PALETTES = [
["#69d2e7","#a7dbd8","#e0e4cc","#f38630","#fa6900"],
["#fe4365","#fc9d9a","#f9cdad","#c8c8a9","#83af9b"],
["#c8c8a9","#83af9b","#fe4365","#fc9d9a","#f9cdad"],
["#ecd078","#d95b43","#c02942","#542437","#53777a"],
["#556270","#4ecdc4","#c7f464","#ff6b6b","#c44d58"],
["#774f38","#e08e79","#f1d4af","#ece5ce","#c5e0dc"],
["#e8d5b7","#8fbc94","#6b9b7e","#34675c","#1d3124"],
["#2d4262","#73605b","#d09683","#ece2d0","#c7b299"],
["#b6a89a","#cfc9c2","#e8e3de","#e1ddd6","#d1c7be"],
["#3fb8af","#7fc7af","#dad8a7","#ff9e9d","#ff3d7f"],
["#d9ceb2","#948c75","#d5ded9","#7a6a53","#99b2b7"],
["#ffffff","#cbe86b","#f2e9e1","#1c140d","#cbe86b"],
["#efffcd","#dce9be","#555152","#2e2633","#99173c"],
["#343838","#005f6b","#008c9e","#00b4cc","#00dffc"],
["#413e4a","#73626e","#b38184","#f0b49e","#f7e4be"],
["#ff4e50","#fc913a","#f9d423","#ede574","#e1f5c4"],
["#99b898","#fecea8","#ff847c","#e84a5f","#2a363b"],
["#655643","#80bca3","#f6f7bd","#e6ac27","#bf4d28"],
["#00a0b0","#6a4a3c","#cc333f","#eb6841","#edc951"],
["#e94f64","#323745","#03a9f4","#f39c12","#03a9f4"],
["#3e4147","#fffedf","#dfba69","#5a1e5b","#fe4c6b"],
["#f0d8a8","#3d1c02","#86b8b1","#f2d694","#fa2a00"],
["#2a044a","#0b2e59","#0d6759","#7ab317","#a0c55f"],
["#f04155","#ff823a","#f2f26f","#fff7bd","#95d6a4"],
["#b9d7d9","#668284","#2a2829","#f85931","#ce1836"],
["#b3cc57","#ecf081","#ffbe40","#ef746f","#ab3e5b"],
["#a3a948","#edb92e","#f85931","#ce1836","#009989"],
["#fc354c","#29221f","#13747d","#0abfbc","#fcf7c5"],
["#1b325f","#9cc4e4","#e9f2f9","#3a89c9","#f26c4f"],
["#e8d5b7","#06746e","#31a9b8","#258039","#f6c50a"],
["#f0f0f0","#e8d44d","#f26c4f","#e94c3f","#3c3c3c"],
["#6da67a","#77b885","#86cf96","#97e1a7","#a7f2b8"],
["#e8dccb","#ccbfa4","#b09f80","#8a7c64","#6e634d"],
["#1b1b1b","#fc4349","#d7ef9b","#1b6ca8","#1c109c"],
["#5d4037","#795548","#a1887f","#d7ccc8","#efebe9"],
["#fad089","#ff9c5b","#f5634a","#ed303c","#3b1d8e"],
["#c6bcb6","#96897f","#625750","#3e3028","#2a1d15"],
["#f9d5e5","#eeac99","#e06377","#c83349","#5b9aa0"],
["#d6e1e5","#b0c7cd","#89adb5","#5d8a96","#2e6678"],
["#cfffdd","#b4dfc4","#88c9a1","#5ba37e","#2e7d52"],
["#e5e9f0","#d8dee9","#4c566a","#3b4252","#2e3440"],
["#f9f9f9","#e8e8e8","#d0d0d0","#a0a0a0","#505050"],
["#fde8d8","#f4c9ac","#e9a97e","#d88b54","#c26d2c"],
["#f7f7f7","#dce2c8","#b4c7a1","#8aab7e","#5e8f5d"],
["#a8e6cf","#dcedc1","#ffd3b6","#ffaaa5","#ff8b94"],
["#f8b500","#f4831f","#cc2a36","#4b1248","#2b0b3f"],
["#f0f5f9","#c9d6df","#52616b","#1e2832","#0a1217"],
["#e3e2df","#d0cfc9","#b3b1a9","#888680","#5c5954"],
["#f5f0e8","#e8d9c4","#d4bb98","#b89567","#8a6a3c"],
["#d4f1f4","#75e6da","#189ab4","#05445e","#0a2342"],
["#f6f0e4","#e2c97e","#c0a44c","#8a7430","#5c4c1c"],
["#f9ebde","#e8c8a0","#d4a66a","#b8823a","#7c5418"],
["#faebd7","#deb887","#cd853f","#8b6914","#4a3800"],
["#fff9f0","#ffe4b5","#ffa54f","#cd7f32","#8b4513"],
["#f0f4c3","#c5e1a5","#81c784","#388e3c","#1b5e20"],
["#e8f5e9","#a5d6a7","#4caf50","#2e7d32","#1a3a1a"],
["#e0f7fa","#80deea","#00bcd4","#0097a7","#006064"],
["#e1f5fe","#81d4fa","#29b6f6","#0288d1","#01579b"],
["#ede7f6","#ce93d8","#ab47bc","#7b1fa2","#4a148c"],
["#fce4ec","#f48fb1","#e91e63","#ad1457","#880e4f"],
["#fff8e1","#ffe082","#ffca28","#f9a825","#f57f17"],
["#efebe9","#d7ccc8","#bcaaa4","#795548","#3e2723"],
["#fafafa","#f5f5f5","#eeeeee","#bdbdbd","#757575"],
["#eceff1","#cfd8dc","#90a4ae","#546e7a","#263238"],
["#fff3e0","#ffcc80","#ffa726","#ef6c00","#bf360c"],
["#f9fbe7","#dce775","#cddc39","#827717","#33691e"],
["#e8eaf6","#9fa8da","#3f51b5","#1a237e","#0d0d3f"],
["#e0f2f1","#80cbc4","#009688","#00695c","#004d40"],
["#fce4ec","#f8bbd0","#f06292","#c2185b","#880e4f"],
["#f3e5f5","#ce93d8","#9c27b0","#6a1b9a","#38006b"],
["#e8f5e9","#c8e6c9","#66bb6a","#2e7d32","#1b5e20"],
["#fff9c4","#fff176","#ffee58","#f9a825","#f57f17"],
["#fbe9e7","#ffab91","#ff5722","#bf360c","#6d1f00"],
["#f1f8e9","#aed581","#8bc34a","#558b2f","#33691e"],
["#e3f2fd","#90caf9","#42a5f5","#1565c0","#0d47a1"],
["#f9f0ff","#ce93d8","#ab47bc","#6a1b9a","#2e003e"],
["#e8f4f8","#b3d9e8","#6baed6","#2171b5","#084594"],
["#fff0e6","#ffd0a8","#ffa062","#e06030","#9c3010"],
["#f0fffe","#b2f5ea","#38b2ac","#2c7a7b","#1d4044"],
["#fff5f5","#fed7d7","#fc8181","#e53e3e","#742a2a"],
["#f0fff4","#c6f6d5","#68d391","#276749","#1c4532"],
["#fffff0","#fefcbf","#faf089","#d69e2e","#744210"],
["#f0f0ff","#c3dafe","#7f9cf5","#5a67d8","#3730a3"],
["#fff5ee","#ffd5b8","#ff9a6c","#e5622c","#a0330c"],
["#f5fffa","#b2f0d8","#55e0a8","#1a9f6e","#0a5c3c"],
["#fffaf0","#ffecd0","#ffcb96","#e08e40","#8c5a18"],
["#f8f9ff","#d4d8f0","#9fa8da","#5c6bc0","#283593"],
["#fff9fb","#fce4ec","#f06292","#d81b60","#880e4f"],
["#f7fffe","#ccf2f4","#a4ebf3","#22a6b3","#116872"],
["#fefffe","#d5f5e3","#82e0aa","#27ae60","#1d6a38"],
["#fffde7","#fff59d","#ffee58","#fbc02d","#f57f17"],
["#f4f4ff","#dde1ff","#b3bcff","#4c5bd4","#1a2090"],
["#fff2cc","#ffe066","#ffc000","#e6a000","#7f5a00"],
["#e8f8f5","#a9dfbf","#52be80","#1e8449","#0b5345"],
["#fdf2f8","#f9a8d4","#ec4899","#9d174d","#500724"],
["#f0f9ff","#bae6fd","#38bdf8","#0284c7","#0c4a6e"],
["#fff7ed","#fed7aa","#fb923c","#c2410c","#7c2d12"],
["#ecfdf5","#a7f3d0","#34d399","#059669","#064e3b"],
["#fdf4ff","#e9d5ff","#c084fc","#7e22ce","#3b0764"],
["#f8fafc","#e2e8f0","#94a3b8","#334155","#0f172a"],
["#fff1f2","#fecdd3","#fb7185","#be123c","#881337"],
["#f0fdf4","#bbf7d0","#4ade80","#15803d","#14532d"],
["#fafafa","#d4d4d4","#737373","#262626","#0a0a0a"],
["#fdf6e3","#e8d5a3","#c5a028","#7c5c00","#3d2900"],
];

// ═══════════════════════════════════════════════════════════════
// PALETTE STATE — shared across all tools in this session
// ═══════════════════════════════════════════════════════════════
// null = no palette applied yet; tools use their own defaults.
// Once a palette is picked it becomes `currentPalette` and gets applied
// to every tool the user switches to.
let currentPalette = null;
let currentPaletteIndex = -1;

// Apply `palette` (array of up to 5 hex strings) to a tool's state by
// overwriting the first N color-typed controls. Returns true if any
// slot was changed.
function applyPaletteToTool(tool, palette) {
  if (!tool || !palette) return false;
  const colorCtrls = tool.controls.filter(c => c.type === 'color');
  if (!toolState[tool.slug]) toolState[tool.slug] = {};
  const s = toolState[tool.slug];
  let changed = false;
  const n = Math.min(colorCtrls.length, palette.length);
  for (let i = 0; i < n; i++) {
    if (s[colorCtrls[i].id] !== palette[i]) {
      s[colorCtrls[i].id] = palette[i];
      changed = true;
    }
  }
  return changed;
}

// Apply a palette to EVERY registered tool's state (so a later switch
// already has palette colours pre-loaded), and also refresh the panel
// for the currently-selected tool so swatches update visually.
function applyPaletteGlobal(palette, paletteIndex = -1) {
  currentPalette = palette;
  currentPaletteIndex = paletteIndex;
  TOOLS.forEach(t => applyPaletteToTool(t, palette));
  if (currentTool && window.buildPanel) {
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
    return `<div class="palette-row" role="option" data-idx="${idx}">
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

  function choose(idx) {
    const palette = NICE_PALETTES[idx];
    if (!palette) return;
    if (typeof pushUndo === 'function') pushUndo();
    applyPaletteGlobal(palette, idx);
    paintButton(palette, `Palette ${String(idx + 1).padStart(3, '0')}`);
    list.querySelectorAll('.palette-row').forEach(r => {
      r.classList.toggle('active', parseInt(r.dataset.idx, 10) === idx);
    });
    close();
  }

  function open()  { root.classList.add('open');    button.setAttribute('aria-expanded', 'true');  panel.hidden = false; search.focus(); }
  function close() { root.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); panel.hidden = true;  }
  function toggle() { root.classList.contains('open') ? close() : open(); }

  button.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  search.addEventListener('input', () => renderList(search.value));
  search.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) close();
  });
})();
