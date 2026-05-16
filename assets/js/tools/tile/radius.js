// 1. Radius — clip each cell with one of five corner-circles, fill with random palette colour.
function renderTileRadius(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  const shadow = s.shadow ? addDropShadow(defs, 12, 0.25) : null;
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
    if (!chance(freq)) return;
    const clip = pickFrom([
      clipCircleInCell(x, y, w, h, 1.0, 0, 0),
      clipCircleInCell(x, y, w, h, 1.0, 1, 0),
      clipCircleInCell(x, y, w, h, 1.0, 1, 1),
      clipCircleInCell(x, y, w, h, 1.0, 0, 1),
      clipCircleInCell(x, y, w, h, 0.5, 0.5, 0.5),
    ]);
    const cpId = addClipPath(defs, clip);
    const r = svgEl('rect', {
      x, y, width:w, height:h,
      fill: pickFrom([pal[1], pal[2], pal[3], pal[4], pal[5]]),
      'clip-path': `url(#${cpId})`
    });
    if (shadow) r.setAttribute('filter', `url(#${shadow})`);
    cell.appendChild(r);
  });
}

registerTilePreset({
  slug:'tile-radius', name:'Radius', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14"/><path d="M10 3 L10 17 M3 10 L17 10"/><path d="M3 3 A4 4 0 0 1 7 7"/><path d="M17 17 A4 4 0 0 1 13 13"/></svg>', render:renderTileRadius,
  palette:['#FFFFFF','#3B3F45','#3FFFB2','#3EECFF','#97F4FF','#FF3D8B'],
  defaults:{ grid:'4x6', frequency:1, shadow:false },
  extras:['grid','frequency','shadow']
});
