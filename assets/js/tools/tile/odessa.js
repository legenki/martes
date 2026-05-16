// 3. Odessa — wide capsule blocks 1×/2×/3× cell height.
// Cells: width 100%%, height random multiple (1×/2×/3×), capsule radius;
// background can be any of color0..color4 (color0 = container bg ⇒ "holes").
// We clip the whole render to the canvas so over-tall blocks don't leak.
function renderTileOdessa(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  const shadow = s.shadow ? addDropShadow(defs, 14, 0.22) : null;
  const wrapId = tileId('wrap');
  const cp = svgEl('clipPath', { id: wrapId });
  cp.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H }));
  defs.appendChild(cp);
  const g = svgEl('g', { 'clip-path': `url(#${wrapId})` });
  svg.appendChild(g);
  tileGrid(g, W, H, grid, 'none', (cell, x, y, w, h) => {
    if (!chance(freq)) return;
    const heightMul = pickFrom([1, 2, 3]);
    // Full cell width; height grows downward from the cell's top edge.
    const blockH = h * heightMul;
    // border-radius:200px on a cell that's usually < 400px wide — clamp to half-width
    // for clean capsule edges. Effect: clean capsule edges regardless of cell size.
    const radius = Math.min(200, w / 2, blockH / 2);
    const r = svgEl('rect', {
      x, y,
      width: w, height: blockH,
      rx: radius, ry: radius,
      fill: pickFrom([pal[0], pal[1], pal[2], pal[3], pal[4]])
    });
    if (shadow) r.setAttribute('filter', `url(#${shadow})`);
    cell.appendChild(r);
  });
}

registerTilePreset({
  slug:'tile-odessa', name:'Odessa', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="3" height="14" rx="1.5"/><rect x="8.5" y="6" width="3" height="11" rx="1.5"/><rect x="13" y="3" width="3" height="10" rx="1.5"/></svg>', render:renderTileOdessa,
  palette:['#FFFFFF','#3FFFB2','#D89FFF','#D89FFF','#FF3D8B','#FFFFFF'],
  defaults:{ grid:'4x6', frequency:0.4, shadow:false },
  extras:['grid','frequency','shadow']
});
