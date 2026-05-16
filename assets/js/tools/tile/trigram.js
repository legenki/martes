// 9. Trigram — central vertical bar with two satellite bars, all rotated.
function renderTileTrigram(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  const radius = s.roundedCorners ? 9999 : 0;  // border-radius:320px or 0
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
    if (!chance(freq)) return;
    const cx = x + w / 2, cy = y + h / 2;
    const angle = pickFrom([45, 90, 135, 180, 0]);
    const fill = pickFrom([pal[1], pal[2], pal[3], pal[4]]);
    const barW = w * 0.10, barH = h * 0.50;
    const g = svgEl('g', { transform: rotateAttr(angle, cx, cy) });
    // Centre bar
    g.appendChild(svgEl('rect', {
      x: cx - barW/2, y: cy - barH/2,
      width: barW, height: barH,
      rx: Math.min(radius, barW/2), ry: Math.min(radius, barW/2),
      fill
    }));
    // Left satellite (left: 200% relative to bar width → 2 × barW away).
    g.appendChild(svgEl('rect', {
      x: cx - barW/2 - barW*2, y: cy - barH/2,
      width: barW, height: barH,
      rx: Math.min(radius, barW/2), ry: Math.min(radius, barW/2),
      fill
    }));
    // Right satellite
    g.appendChild(svgEl('rect', {
      x: cx + barW/2 + barW, y: cy - barH/2,
      width: barW, height: barH,
      rx: Math.min(radius, barW/2), ry: Math.min(radius, barW/2),
      fill
    }));
    cell.appendChild(g);
  });
}

registerTilePreset({
  slug:'tile-trigram', name:'Trigram', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="14" height="2" rx="1"/><rect x="3" y="9" width="14" height="2" rx="1"/><rect x="3" y="13" width="14" height="2" rx="1"/></svg>', render:renderTileTrigram,
  palette:['#FFFFFF','#3E8BFF','#FF3D8B','#3FFF50','#F5DD32','#FFFFFF'],
  defaults:{ grid:'4x6', frequency:1, roundedCorners:true },
  extras:['grid','frequency','roundedCorners']
});
