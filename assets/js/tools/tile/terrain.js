// 8. Terrain — small floating shapes + box-shadow rules (top-edge / left-edge lines).
function renderTileTerrain(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  const { cols, rows } = parseGrid(grid);
  const cw = W / cols, ch = H / rows;
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h, col, row) => {
    // Top edge highlight
    if (chance(freq)) cell.appendChild(svgEl('rect', { x, y, width:w, height:1, fill: pal[1] }));
    // Left edge highlight
    if (chance(freq)) cell.appendChild(svgEl('rect', { x, y, width:1, height:h, fill: pal[1] }));
    // Small floating shape (8–32px, scaled to cell width).
    if (chance(freq)) {
      const size = (8 + Math.random() * 24) * 6 / cols;
      const cx = x + w / 2, cy = y + h / 2;
      const fill = pickFrom([pal[2], pal[3], pal[4], pal[5]]);
      const kind = Math.floor(Math.random() * 3);
      if (kind === 0) {
        // Triangle
        cell.appendChild(svgEl('polygon', {
          points: `${cx},${cy-size/2} ${cx-size/2},${cy+size/2} ${cx+size/2},${cy+size/2}`,
          fill
        }));
      } else if (kind === 1) {
        // Circle
        cell.appendChild(svgEl('circle', { cx, cy, r: size/2, fill }));
      } else {
        // Diamond
        cell.appendChild(svgEl('polygon', {
          points: `${cx},${cy-size/2} ${cx+size/2},${cy} ${cx},${cy+size/2} ${cx-size/2},${cy}`,
          fill
        }));
      }
    }
  });
}

registerTilePreset({
  slug:'tile-terrain', name:'Terrain', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14"/><path d="M3 10 L17 10 M10 3 L10 17"/><path d="M6 7 L7 5 L8 7 Z" fill="currentColor"/><circle cx="14" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="14" r="1" fill="currentColor"/><path d="M13 13 L15 13 L14 15 Z" fill="currentColor"/></svg>', render:renderTileTerrain,
  palette:['#FFFFFF','#CED3D9','#FF3D8B','#3FFFB2','#275AA6','#3EECFF'],
  defaults:{ grid:'4x6', frequency:0.6 },
  extras:['grid','frequency']
});
