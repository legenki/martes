// 5. Blossom — faithful port of the tile artwork. The cell is clipped
// to a U/∩/circle/square shape filled with randomColor. A :before pseudo
// element (color0 = bg) sits half-off the cell with an astroid clip — visible
// only where it overlaps the cell, creating a curved cut-out.
//
// Variant A: border-radius:0 0 100% 100%  → cell is a U (rounded bottom);
//            :before top:-50% with astroid → bottom-half-astroid carves the
//            top half of the cell.
// Variant B: border-radius:100% 100% 0 0  → ∩ (rounded top);
//            :before top: 50% astroid → top-half-astroid carves the bottom.
// Variant C: clip-path circle OR full rect rotated 0/90/180; :before is
//            solid randomColor filling the cell. (linear-gradient w/ same
//            colour at both stops = solid.)
function renderTileBlossom(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
    if (!chance(freq)) return;
    const variant = pickFrom([0, 1, 2]);
    const cx = x + w / 2;
    const fillC = pickFrom([pal[1], pal[2], pal[3], pal[4], pal[5]]);

    if (variant === 0) {
      // U-shape: top corners square, bottom corners fully rounded (radius = w/2).
      // Path: start top-left, top-right, then arc down through full cell height.
      const r = w / 2;
      const cellPath = `M${x} ${y} L${x+w} ${y} L${x+w} ${y+h-r} A${r} ${r} 0 0 1 ${x+w-r} ${y+h} L${x+r} ${y+h} A${r} ${r} 0 0 1 ${x} ${y+h-r} Z`;
      cell.appendChild(svgEl('path', { d: cellPath, fill: fillC }));
      // Astroid: centred at the top edge of the cell, radius = w/2, only the
      // bottom half is visible inside the cell. Colour = bg → carves cell.
      cell.appendChild(svgEl('path', {
        d: hypocycloidPath(cx, y, w / 2, 4),
        fill: pal[0]
      }));
    } else if (variant === 1) {
      // ∩-shape: bottom corners square, top corners rounded.
      const r = w / 2;
      const cellPath = `M${x} ${y+r} A${r} ${r} 0 0 1 ${x+r} ${y} L${x+w-r} ${y} A${r} ${r} 0 0 1 ${x+w} ${y+r} L${x+w} ${y+h} L${x} ${y+h} Z`;
      cell.appendChild(svgEl('path', { d: cellPath, fill: fillC }));
      // Astroid at the bottom edge, top half visible inside.
      cell.appendChild(svgEl('path', {
        d: hypocycloidPath(cx, y + h, w / 2, 4),
        fill: pal[0]
      }));
    } else {
      // Solid circle or full rect rotated — single fill, no stripes.
      const angle = pickFrom([0, 90, 180]);
      const useCircle = chance(0.5);
      if (useCircle) {
        cell.appendChild(svgEl('ellipse', {
          cx, cy: y + h / 2, rx: w / 2, ry: h / 2,
          fill: fillC,
          transform: rotateAttr(angle, cx, y + h / 2)
        }));
      } else {
        cell.appendChild(svgEl('rect', {
          x, y, width: w, height: h,
          fill: fillC,
          transform: rotateAttr(angle, cx, y + h / 2)
        }));
      }
    }
  });
}

registerTilePreset({
  slug:'tile-blossom', name:'Blossom', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17 L10 10 A5 5 0 0 0 10 17 Z M10 10 A5 5 0 0 1 10 17" fill="currentColor" opacity="0.15"/><path d="M3 17 L3 10 A7 7 0 0 1 17 10 L17 17 Z"/><path d="M5 3 Q10 8 5 8 Q10 8 5 3 M15 3 Q10 8 15 8 Q10 8 15 3" transform="translate(0 -2)"/></svg>', render:renderTileBlossom,
  palette:['#FFFFFF','#3EECFF','#FFA1C6','#3FFFB2','#ECFF3D','#FF3D8B'],
  defaults:{ grid:'2x3', frequency:1 },
  extras:['grid','frequency']
});
