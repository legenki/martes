// 2. Mixtape — Radius + triangle clips + occasional striped overlay.
function renderTileMixtape(svg, W, H, s) {
  const { defs, pal, grid, freq } = setupTile(svg, W, H, s);
  const shadow = s.shadow ? addDropShadow(defs, 10, 0.2) : null;
  tileGrid(svg, W, H, grid, pal[0], (cell, x, y, w, h) => {
    if (chance(freq)) {
      const clipOptions = [
        clipCircleInCell(x, y, w, h, 1.0, 0, 0),
        clipCircleInCell(x, y, w, h, 1.0, 1, 0),
        clipCircleInCell(x, y, w, h, 1.0, 1, 1),
        clipCircleInCell(x, y, w, h, 1.0, 0, 1),
        clipCircleInCell(x, y, w, h, 0.5, 0.5, 0.5),
        clipCircleInCell(x, y, w, h, 0.25, 0.5, 0.5),
        pathPolygon([[x,y],[x,y+h],[x+w,y+h]]),
        pathPolygon([[x+w,y],[x,y],[x+w,y+h]]),
        pathPolygon([[x+w,y],[x,y],[x,y+h]]),
        pathPolygon([[x+w,y+h],[x+w,y],[x,y+h]]),
      ];
      const cpId = addClipPath(defs, pickFrom(clipOptions));
      const r = svgEl('rect', {
        x, y, width:w, height:h,
        fill: pickFrom([pal[1], pal[2], pal[3], pal[4], pal[5]]),
        'clip-path': `url(#${cpId})`
      });
      if (shadow) r.setAttribute('filter', `url(#${shadow})`);
      cell.appendChild(r);
    }
    if (chance(0.2)) {
      // Diagonal stripes confined to a corner-circle clip.
      const cnr = pickFrom([[0,0],[1,0],[1,1],[0,1]]);
      const cpId = addClipPath(defs, clipCircleInCell(x, y, w, h, 1.0, cnr[0], cnr[1]));
      const stripeAngle = pickFrom([45, 135]);
      const stripeId = tileId('stripe');
      const pat = svgEl('pattern', {
        id: stripeId, patternUnits:'userSpaceOnUse',
        width: w * 0.1, height: w * 0.1,
        patternTransform: `rotate(${stripeAngle})`
      });
      pat.appendChild(svgEl('rect', { x:0, y:0, width:w*0.05, height:w*0.1, fill: pal[0] }));
      pat.appendChild(svgEl('rect', { x:w*0.05, y:0, width:w*0.05, height:w*0.1, fill: pal[1] }));
      defs.appendChild(pat);
      cell.appendChild(svgEl('rect', {
        x, y, width:w, height:h,
        fill: `url(#${stripeId})`,
        'clip-path': `url(#${cpId})`
      }));
    }
  });
}

registerTilePreset({
  slug:'tile-mixtape', name:'Mixtape', icon:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14"/><path d="M3 10 L17 10"/><path d="M3 3 L10 10 L3 17" fill="currentColor" opacity="0.25"/><path d="M17 3 A7 7 0 0 1 10 10"/></svg>', render:renderTileMixtape,
  palette:['#FFFFFF','#232529','#3E8BFF','#3FFFB2','#3EECFF','#3FFFB2'],
  defaults:{ grid:'4x6', frequency:1, shadow:false },
  extras:['grid','frequency','shadow']
});
