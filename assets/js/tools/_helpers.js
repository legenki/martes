// ═══════════════════════════════════════════════════════════════
// TILE — shared helpers for grid presets (clip-paths, filters, palette)
// Used by all tools/tile/*.js preset files.
// ═══════════════════════════════════════════════════════════════

// ── Grid engine ────────────────────────────────────────────────
// Parse "4x6" → { cols:4, rows:6 }. Convention:
// "C x R" reads as columns × rows.
function parseGrid(g) {
  const [c, r] = String(g).split('x').map(Number);
  return { cols: c || 4, rows: r || 6 };
}

// Walk a cols × rows grid, calling paint() for each cell with its
// pixel rect and 1-based row/col index (matching @size-row / @size-col).
function tileGrid(parent, W, H, gridStr, bgColor, paint) {
  const { cols, rows } = parseGrid(gridStr);
  // Background — first palette colour fills the cell wrapper.
  parent.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill: bgColor }));
  const cw = W / cols, ch = H / rows;
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const x = (c - 1) * cw, y = (r - 1) * ch;
      const cell = svgEl('g', {
        // Group keeps a cell painted as a unit; SVG clips per shape.
        // We use clipPath rather than overflow because SVG groups don't honour it.
      });
      paint(cell, x, y, cw, ch, c, r, cols, rows);
      parent.appendChild(cell);
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────
function pickFrom(arr)  { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p)      { return Math.random() < p; }
function rotateAttr(angle, cx, cy) { return `rotate(${angle} ${cx} ${cy})`; }

// Weighted-ish pick from many args — modelled as
// uniform random pick (close enough for our visual purposes).
const colorOf = (palette, i) => palette[i] || palette[palette.length - 1];

// Alias to the global uid() in core.js.
const tileId = uid;

// ── Clip-path families (corner circles, center square/diamond, …) ──
// All return a path-string suitable for use inside <clipPath>.
function pathRect(x, y, w, h) {
  return `M${x} ${y}h${w}v${h}h${-w}z`;
}
function pathCircleAt(cx, cy, r) {
  // Quarter-then-quarter half-arcs for a full circle.
  return `M${cx-r} ${cy} a${r} ${r} 0 1 0 ${2*r} 0 a${r} ${r} 0 1 0 ${-2*r} 0 z`;
}
function pathPolygon(points) {
  return 'M' + points.map(p => p.join(' ')).join('L') + 'Z';
}
// "circle(R% at X% Y%)" → an absolute circle clipping a cell.
function clipCircleInCell(x, y, w, h, rPct, cxPct, cyPct) {
  const cx = x + w * cxPct, cy = y + h * cyPct;
  // rPct is a percentage of the cell side; we approximate
  // with width (cells are usually rectangular but the ratio doesn't blow up).
  const r  = rPct * Math.min(w, h);
  return pathCircleAt(cx, cy, r);
}

// Hypocycloid path centred on (cx, cy) inside radius R, with k cusps.
// Parametric: x = (R - r)cosθ + r cos((R-r)/r · θ),
//             y = (R - r)sinθ - r sin((R-r)/r · θ).
// k cusps require R/r = k.
function hypocycloidPath(cx, cy, R, k = 4, steps = 80) {
  const r = R / k;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = cx + (R - r) * Math.cos(t) + r * Math.cos((R - r) / r * t);
    const y = cy + (R - r) * Math.sin(t) - r * Math.sin((R - r) / r * t);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return d + 'Z';
}

// Add a `<clipPath id=...><path d=.../></clipPath>` to defs, return id.
function addClipPath(defs, d) {
  const id = tileId('clip');
  const cp = svgEl('clipPath', { id });
  cp.appendChild(svgEl('path', { d }));
  defs.appendChild(cp);
  return id;
}

// Make a soft drop-shadow filter; returns id.
function addDropShadow(defs, stdDev = 8, opacity = 0.2) {
  const id = tileId('shadow');
  const f = svgEl('filter', { id, x:'-20%', y:'-20%', width:'140%', height:'140%' });
  f.appendChild(svgEl('feGaussianBlur', { in:'SourceAlpha', stdDeviation: stdDev }));
  f.appendChild(svgEl('feOffset', { dx:0, dy:0, result:'offsetblur' }));
  const cm = svgEl('feComponentTransfer');
  const ft = svgEl('feFuncA', { type:'linear', slope: opacity });
  cm.appendChild(ft); f.appendChild(cm);
  const merge = svgEl('feMerge');
  merge.appendChild(svgEl('feMergeNode'));
  merge.appendChild(svgEl('feMergeNode', { in:'SourceGraphic' }));
  f.appendChild(merge);
  defs.appendChild(f);
  return id;
}

// ── Shared palette colour resolver ─────────────────────────────
// Pull color0..colorN out of state. State stores them as colorN keys.
function paletteFrom(s, n) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(s['color' + i] || '#fff');
  return arr;
}

// Every tile preset render shares this set-up.
function setupTile(svg, W, H, s) {
  const defs = svgEl('defs');
  svg.appendChild(defs);
  const pal = paletteFrom(s, 6);
  return { defs, pal, grid: s.grid, freq: s.frequency };
}

// ── Tile preset registration helper ───────────────────────────
// Builds standard controls from palette + extras and pushes to TOOLS.
function registerTilePreset(preset) {
  const controls = preset.palette.map((col, i) => ({
    type:'color', id:'color'+i, label:'Color '+i, default: col
  }));
  if (preset.extras.includes('grid')) {
    controls.push({
      type:'btngroup', id:'grid', label:'Columns and rows',
      default: preset.defaults.grid,
      // Portrait (2:3-ish) AND square grids — pick what matches your canvas.
      options:['2x3','2x2','4x6','4x4','6x9','6x6','8x12','8x8','10x15','10x10']
    });
  }
  if (preset.extras.includes('frequency')) {
    controls.push({
      type:'range', id:'frequency', label:'Frequency',
      default: preset.defaults.frequency, min:0.2, max:1, step:0.2
    });
  }
  if (preset.extras.includes('circularity')) {
    controls.push({
      type:'range', id:'circularity', label:'Circularity',
      default: preset.defaults.circularity, min:0, max:1, step:0.1
    });
  }
  if (preset.extras.includes('shadow')) {
    controls.push({ type:'toggle', id:'shadow', label:'Shadow', default: preset.defaults.shadow });
  }
  if (preset.extras.includes('roundedCorners')) {
    controls.push({ type:'toggle', id:'roundedCorners', label:'Rounded corners', default: preset.defaults.roundedCorners });
  }
  TOOLS.push({
    cat:'Tile',
    slug: preset.slug,
    name: preset.name,
    icon: preset.icon || '',
    desc: preset.desc || ('Tile preset — ' + preset.name),
    render: preset.render,
    controls
  });
}
