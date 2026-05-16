// 6. Disque — original draw order in tile:
//   1. cell background = repeating-linear-gradient (horizontal OR vertical OR none)
//   2. :before — repeating-linear-gradient (the opposite axis), if separate random hits
//   3. :after — half-circle on one of 4 sides, on top of everything
// Stripes are color0 (cell bg) on color1 — i.e. dark bands against light bg.
function renderTileDisque(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
    // 1. Horizontal stripes background (16% chance).
    // repeating-linear-gradient(0deg, color0 0-10%, color1 10-20%) = stripes of color0 with
    // color1 between them. color0 is already the bg, so we just draw color1 bands.
    if (chance(0.16)) {
      const bandH = h * 0.1;
      for (let i = 1; i < 10; i += 2) {
        cell.appendChild(svgEl('rect', { x, y: y + i*bandH, width:w, height:bandH, fill: pal[1] }));
      }
    }
    // 2. Vertical stripes (16% chance) — drawn on top of horizontal if both fire.
    if (chance(0.16)) {
      const bandW = w * 0.1;
      for (let i = 1; i < 10; i += 2) {
        cell.appendChild(svgEl('rect', { x: x + i*bandW, y, width:bandW, height:h, fill: pal[1] }));
      }
    }
    // 3. Half-circle on one of 4 sides (drawn last → on top of stripes).
    if (chance(freq)) {
      const side = pickFrom(['bottom','top','left','right']);
      const fill = pickFrom([pal[2], pal[3], pal[4], pal[5]]);
      const path =
        side === 'bottom' ? clipCircleInCell(x, y, w, h, 0.5, 0.5, 1) :
        side === 'top'    ? clipCircleInCell(x, y, w, h, 0.5, 0.5, 0) :
        side === 'left'   ? clipCircleInCell(x, y, w, h, 0.5, 0, 0.5) :
                            clipCircleInCell(x, y, w, h, 0.5, 1, 0.5);
      const cpId = addClipPath(defs, path);
      cell.appendChild(svgEl('rect', {
        x, y, width:w, height:h, fill, 'clip-path':`url(#${cpId})`
      }));
    }
  });
}

registerTilePreset({
  slug:'tile-disque', name:'Disque', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14"/><path d="M3 7 L17 7 M3 11 L17 11 M3 15 L17 15" stroke-dasharray="2 1"/><path d="M10 3 A5 5 0 0 1 10 13 Z" fill="currentColor" opacity="0.3"/></svg>', render:renderTileDisque,
  palette:['#FFFFFF','#232529','#3EECFF','#FF3D8B','#3FFFB2','#F5DD32'],
  defaults:{ grid:'4x6', frequency:1 },
  extras:['grid','frequency']
});
