// 10. Ring — two concentric ring outlines, the outer one nudged by random offset.
function renderTileRing(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  const { rows } = parseGrid(grid);
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
    if (!chance(freq)) return;
    const cx = x + w / 2, cy = y + h / 2;
    const sz = Math.min(w, h) * 0.5;
    const angle = pickFrom([45, 90, 135, 180, 225, 270, 315, 360, 0]);
    const outerColor = pal[3] || pal[1];
    const innerColor = pickFrom([pal[1], pal[2]]);
    const strokeW = 40 / rows;
    const g = svgEl('g', { transform: rotateAttr(angle, cx, cy) });
    // Outer (offset, lower opacity)
    const dx = (Math.random() * 0.4 - 0.2) * sz;
    const dy = (Math.random() * 0.4 - 0.2) * sz;
    g.appendChild(svgEl('circle', {
      cx: cx + dx, cy: cy + dy, r: sz/2,
      fill:'none', stroke: outerColor, 'stroke-width': strokeW, opacity: 0.4
    }));
    g.appendChild(svgEl('circle', {
      cx, cy, r: sz/2,
      fill:'none', stroke: innerColor, 'stroke-width': strokeW
    }));
    cell.appendChild(g);
  });
}

registerTilePreset({
  slug:'tile-ring', name:'Ring', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="10" r="5"/><circle cx="12" cy="10" r="5" opacity="0.5"/></svg>', render:renderTileRing,
  palette:['#9EFFD8','#FFFFFF','#9EFFD8','#232529','#9EFFD8','#9EFFD8'],
  defaults:{ grid:'2x3', frequency:1 },
  extras:['grid','frequency']
});
