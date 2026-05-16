// 4. Veil — random triangle filling the cell.
function renderTileVeil(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
    if (!chance(freq)) return;
    const tris = [
      [[x,y],[x+w,y],[x+w,y+h]],
      [[x,y],[x+w,y],[x,y+h]],
      [[x,y],[x+w,y+h],[x,y+h]],
      [[x+w,y],[x+w,y+h],[x,y+h]],
    ];
    cell.appendChild(svgEl('polygon', {
      points: pickFrom(tris).map(p => p.join(',')).join(' '),
      fill: pickFrom([pal[1], pal[2], pal[3], pal[4], pal[5]])
    }));
  });
}

registerTilePreset({
  slug:'tile-veil', name:'Veil', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14"/><path d="M3 3 L17 3 L3 17 Z" fill="currentColor" opacity="0.2"/><path d="M17 17 L3 17 L17 3"/></svg>', render:renderTileVeil,
  palette:['#FFFFFF','#FFA1C6','#3FFFB2','#3EECFF','#1B4075','#326DC9'],
  defaults:{ grid:'8x12', frequency:0.8 },
  extras:['grid','frequency']
});
