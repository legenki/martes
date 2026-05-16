// ── 10. bbburst — uniform Voronoi burst, multi-shape, no-overlap
// NOTE: buildUniformVoronoi, parseSvgShapeInput, normalizeSvgPath are in _voronoi.js

// ── Shape library ─────────────────────────────────────────────
// All paths centered at origin (0,0), fitting in ~±72 units radius.
// fill:true = filled, fill:false = stroke-only
const BB_SHAPES = [
  { id:'triangle',   label:'▲ Triangle',  fill:true,
    d:'M 0,-70 L 61,35 L -61,35 Z' },
  { id:'pentagon',   label:'⬠ Pentagon',  fill:true,
    d:'M 0,-72 L 68,-22 L 42,58 L -42,58 L -68,-22 Z' },
  { id:'diamond',    label:'◆ Diamond',   fill:true,
    d:'M 0,-70 L 48,0 L 0,70 L -48,0 Z' },
  { id:'star',       label:'★ Star',      fill:true,
    d:'M 0,-70 L 15,-24 L 64,-22 L 26,5 L 40,52 L 0,23 L -40,52 L -26,5 L -64,-22 L -15,-24 Z' },
  { id:'circle',     label:'● Circle',    fill:true,
    d:'M 66,0 A 66 66 0 1 1 65.999 0.001 Z' },
  { id:'cross',      label:'✚ Cross',     fill:true,
    d:'M -14,-70 L 14,-70 L 14,-14 L 70,-14 L 70,14 L 14,14 L 14,70 L -14,70 L -14,14 L -70,14 L -70,-14 L -14,-14 Z' },
  { id:'heart',      label:'♥ Heart',     fill:true,
    d:'M 0,58 C -72,-5 -72,-72 0,-36 C 72,-72 72,-5 0,58 Z' },
  { id:'squiggle',   label:'〜 Squiggle',  fill:false,
    d:'M -65,-35 C -32,-78 32,-78 65,-35 C 98,8 32,78 0,42 C -32,8 -98,78 -65,42' },
  { id:'pentagon-o', label:'○ Pent-O',    fill:false,
    d:'M 0,-72 L 68,-22 L 42,58 L -42,58 L -68,-22 Z' },
  { id:'circle-o',   label:'○ Circle-O',  fill:false,
    d:'M 66,0 A 66 66 0 1 1 65.999 0.001 Z' },
  { id:'triangle-o', label:'△ Tri-O',     fill:false,
    d:'M 0,-70 L 61,35 L -61,35 Z' },
  { id:'star-o',     label:'☆ Star-O',    fill:false,
    d:'M 0,-70 L 15,-24 L 64,-22 L 26,5 L 40,52 L 0,23 L -40,52 L -26,5 L -64,-22 L -15,-24 Z' },
  { id:'square-o',   label:'□ Square-O',  fill:false,
    d:'M -58,-58 L 58,-58 L 58,58 L -58,58 Z' },
  { id:'arc',        label:'◠ Arc',       fill:false,
    d:'M -70,22 C -70,-58 70,-58 70,22' },
];

window.bbburstCustomShapes = window.bbburstCustomShapes || [];


function renderBurst(svg, W, H, s) {
  if (!Array.isArray(s.activeShapes)) {
    s.activeShapes = ['triangle','star','cross','circle-o','arc'];
  }

  const activeIds = (s.activeShapes && s.activeShapes.length > 0)
    ? s.activeShapes : ['star','circle-o','triangle','squiggle','cross'];

  const allShapes = [...BB_SHAPES, ...bbburstCustomShapes];
  const activeShapes = allShapes.filter(sh => activeIds.includes(sh.id));
  if (activeShapes.length === 0) return;

  // ── blur filters ─────────────────────────────────────
  const defs = svgEl('defs');
  const blurIds = ['bbb0','bbb1','bbb2','bbb3'];
  [0, 0.8, 2.5, 7].forEach((sd, i) => {
    const f = svgEl('filter', {id:blurIds[i], x:'-40%',y:'-40%',width:'180%',height:'180%'});
    if (sd > 0) f.appendChild(svgEl('feGaussianBlur', {stdDeviation:sd}));
    defs.appendChild(f);
  });
  svg.appendChild(defs);

  svg.appendChild(svgEl('rect', {x:0, y:0, width:W, height:H, fill:s.bgColor}));

  const palette = [s.color1, s.color2, s.color3, s.color4, s.color5].filter(Boolean);
  const ox = s.centerX * W, oy = s.centerY * H;
  const maxDist = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));

  // Build uniform Voronoi — amount slider directly controls N
  const cells = buildUniformVoronoi(W, H, s.amount, ox, oy, 1.4);

  // Deterministic per-cell color using index so adjacent cells differ
  cells.forEach((cell, idx) => {
    if (cell.r < 1.5) return;

    const dist = Math.hypot(cell.cx - ox, cell.cy - oy);
    const t = dist / maxDist; // 0=center → 1=edge

    const shape = activeShapes[idx % activeShapes.length];

    // Size: grows toward edge (center=small, edge=large), randomize ±20%
    const distScale = lerp(0.6, 1.75, t);
    const baseR = cell.r * distScale * rnd(0.75, 1.0);

    // Color: deterministic cycling so neighboring cells look varied
    const ci = (idx * 3 + Math.floor(t * 4)) % palette.length;
    const color = palette[ci];

    // Opacity: full at center, fade to near-zero at edge
    const opacity = clamp(map(t, 0, 0.9, s.opacity, 0.04), 0.03, 1);

    // Blur tier: sharper at center, blurrier at edge (original: 0/1/2/4+scale bands)
    // Only apply blur when enabled
    let blur = '';
    if (s.useBlur !== false) {
      if      (t > 0.72) blur = `url(#${blurIds[3]})`;
      else if (t > 0.50) blur = `url(#${blurIds[2]})`;
      else if (t > 0.30) blur = `url(#${blurIds[1]})`;
    }

    // Shapes are drawn in ±72 unit space
    const shapeR = 70;
    const sc = baseR / shapeR;

    const rot = rnd(0, 360);
    const gAttrs = {
      transform: `translate(${cell.cx.toFixed(1)},${cell.cy.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(5)})`
    };
    if (blur) gAttrs.filter = blur;

    const g = svgEl('g', gAttrs);

    const useStroke = !shape.fill || (shape.isCustom && shape.isStroke);

    if (shape.isCustom && shape._normD) {
      // Custom shape with normalized transform
      const inner = svgEl('g', shape._normTransform ? {transform: shape._normTransform} : {});
      const pathAttrs = { d: shape._normD, opacity };
      if (useStroke) {
        pathAttrs.fill = 'none';
        pathAttrs.stroke = color;
        pathAttrs['stroke-width'] = (s.strokeW / sc).toFixed(2);
        pathAttrs['stroke-linecap'] = 'round';
        pathAttrs['stroke-linejoin'] = 'round';
      } else {
        pathAttrs.fill = color;
        pathAttrs.stroke = 'none';
      }
      if (shape._fillRule && shape._fillRule !== 'nonzero') pathAttrs['fill-rule'] = shape._fillRule;
      inner.appendChild(svgEl('path', pathAttrs));
      g.appendChild(inner);
    } else {
      const pathAttrs = { d: shape.d, opacity };
      if (useStroke) {
        pathAttrs.fill = 'none';
        pathAttrs.stroke = color;
        pathAttrs['stroke-width'] = (s.strokeW / sc).toFixed(2);
        pathAttrs['stroke-linecap'] = 'round';
        pathAttrs['stroke-linejoin'] = 'round';
      } else {
        pathAttrs.fill = color;
        pathAttrs.stroke = 'none';
      }
      g.appendChild(svgEl('path', pathAttrs));
    }

    svg.appendChild(g);
  });
}

TOOLS.push({
  cat: 'Form', slug: 'burst', name: 'Burst', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2 L10 18 M2 10 L18 10 M4 4 L16 16 M16 4 L4 16"/></svg>',
  desc: 'Voronoi burst — multi-shape, no overlap',
  render: renderBurst,
  controls: [
    { type:'color',     id:'bgColor',     label:'Background', default:'#ffffff' },
    { type:'color',     id:'color1',      label:'Color 1',    default:'#FF5C58' },
    { type:'color',     id:'color2',      label:'Color 2',    default:'#00A19D' },
    { type:'color',     id:'color3',      label:'Color 3',    default:'#FFA6D5' },
    { type:'color',     id:'color4',      label:'Color 4',    default:'#2C2891' },
    { type:'color',     id:'color5',      label:'Color 5',    default:'#FFBD9B' },
    { type:'bbshapes',  id:'activeShapes',label:'Form',     default:['triangle','star','cross','circle-o','arc'] },
    { type:'range',     id:'amount',      label:'Amount',     default:111, min:20,  max:300, step:5 },
    { type:'range',     id:'centerX',     label:'Center X',   default:0.5, min:0.0, max:1.0, step:0.05 },
    { type:'range',     id:'centerY',     label:'Center Y',   default:0.5, min:0.0, max:1.0, step:0.05 },
    { type:'toggle',    id:'useBlur',     label:'Blur edges', default:true },
    { type:'range',     id:'opacity',     label:'Opacity',    default:1,   min:0.1, max:1.0, step:0.05 },
    { type:'range',     id:'strokeW',     label:'Stroke w',   default:10,  min:2,   max:30,  step:1 },
  ]
});
