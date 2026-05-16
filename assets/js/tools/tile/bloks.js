// 7. Bloks — a rotated triangle / square + an arch on top.
function renderTileBloks(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  const shadow = s.shadow ? addDropShadow(defs, 12, 0.25) : null;
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
    const cx = x + w / 2, cy = y + h / 2;
    const cellRot = pickFrom([90, 180, 270, 360]);
    // Lower shape — triangle or quarter circle.
    if (chance(freq)) {
      const clip = pickFrom([
        clipCircleInCell(x, y, w, h, 0.5, 0.5, 0.5),
        pathPolygon([[x,y],[x,y+h],[x+w,y+h]]),
        pathPolygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]),
      ]);
      const cpId = addClipPath(defs, clip);
      cell.appendChild(svgEl('rect', {
        x, y, width:w, height:h,
        fill: pickFrom([pal[1], pal[2], pal[3], pal[4], pal[5]]),
        'clip-path': `url(#${cpId})`,
        transform: rotateAttr(cellRot, cx, cy)
      }));
    }
    // Upper shape — semicircle arch (border-radius 200px 200px 0 0).
    if (chance(freq)) {
      const arch = svgEl('path', {
        d: `M${x} ${y+h} L${x} ${y+h*0.5} A${w/2} ${h*0.5} 0 0 1 ${x+w} ${y+h*0.5} L${x+w} ${y+h} Z`,
        fill: pickFrom([pal[1], pal[2], pal[3], pal[4], pal[5]]),
        transform: rotateAttr(cellRot, cx, cy)
      });
      if (shadow) arch.setAttribute('filter', `url(#${shadow})`);
      cell.appendChild(arch);
    }
  });
}

registerTilePreset({
  slug:'tile-bloks', name:'Bloks', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" transform="rotate(45 6 6)"/><rect x="11" y="3" width="6" height="6"/><rect x="3" y="11" width="6" height="6"/><path d="M11 17 L17 17 L17 11 A3 3 0 0 0 11 14 Z"/></svg>', render:renderTileBloks,
  palette:['#FFFFFF','#3B3F45','#3FFFB2','#3EECFF','#97F4FF','#FF3D8B'],
  defaults:{ grid:'4x6', frequency:0.6, shadow:false },
  extras:['grid','frequency','shadow']
});
