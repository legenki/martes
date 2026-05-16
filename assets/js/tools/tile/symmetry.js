// 11. Symmetry — diamonds (rotated squares) with adjustable border-radius.
function renderTileSymmetry(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  const circularity = s.circularity ?? 0.5;
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
    if (!chance(freq)) return;
    const cx = x + w / 2, cy = y + h / 2;
    const angle = pickFrom([0, 45, 90, 135]);
    const sz = Math.min(w, h);
    const fill = pickFrom([pal[1], pal[2], pal[3], pal[4], pal[5]]);
    // Diamond = square rotated 45°. Border-radius = circularity * 50% of side.
    const rad = circularity * sz * 0.5;
    cell.appendChild(svgEl('rect', {
      x: cx - sz/2, y: cy - sz/2,
      width: sz, height: sz,
      rx: rad, ry: rad,
      fill,
      transform: rotateAttr(45 + angle, cx, cy)
    }));
  });
}

registerTilePreset({
  slug:'tile-symmetry', name:'Symmetry', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2 L18 10 L10 18 L2 10 Z"/><path d="M10 6 L14 10 L10 14 L6 10 Z" fill="currentColor" opacity="0.25"/></svg>', render:renderTileSymmetry,
  palette:['#FFFFFF','#97F4FF','#00FFF3','#00A1FF','#FF8DFF','#FF007E'],
  defaults:{ grid:'4x6', frequency:1, circularity:0.5 },
  extras:['grid','frequency','circularity']
});
