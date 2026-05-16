// ── 11. gggyrate — nested concentric shapes with incremental rotation ──
// Algorithm: N shapes centered at canvas center,
// each scaled by i * scaleConstant, rotated by rotationConstant * i degrees.
// Shape paths defined in 800×800 viewBox, centered at (400,400).

const GG_HEXAGON         = 'M400 250L529.904 325V475L400 550L270.096 475V325L400 250Z';
const GG_ROUNDED_HEXAGON = 'M390 255.773C396.188 252.201 403.812 252.201 410 255.774L519.904 319.227C526.084 322.792 529.904 329.368 529.904 336.5V463.5C529.904 470.632 526.084 477.208 519.904 480.773L410 544.226C403.812 547.799 396.188 547.799 390 544.226L280.096 480.773C273.916 477.208 270.096 470.632 270.096 463.5V336.5C270.096 329.368 273.916 322.792 280.096 319.227L390 255.773Z';
const GG_ROUNDED_TRIANGLE = 'M392.83 239.489C395.767 233.553 404.233 233.553 407.17 239.489L524.189 475.952C527.371 482.395 522.715 490 515.519 490H284.481C277.285 490 272.629 482.395 275.811 475.952L392.83 239.489Z';

function ggyrateMakeShapeEl(shape, size, cx, cy) {
  // size = i * scaleConstant (px in 800×800 space)
  const S = size, half = S / 2;
  if (shape === 'square') {
    return svgEl('rect', { x: cx - half, y: cy - half, width: S, height: S });
  } else if (shape === 'triangle') {
    const pts = `${cx},${cy - half * 0.9} ${cx - half},${cy + half * 0.8} ${cx + half},${cy + half * 0.8}`;
    return svgEl('polygon', { points: pts });
  } else {
    // For path-based shapes, scale via transform around center
    // Original paths are ~280px wide at 800×800 center (400,400)
    const origSize = 280; // approx bounding box of shape paths
    const sc = S / origSize;
    const d = shape === 'hexagon' ? GG_HEXAGON
             : shape === 'rounded-triangle' ? GG_ROUNDED_TRIANGLE
             : GG_ROUNDED_HEXAGON;
    const el = svgEl('path', { d });
    // Scale around (400,400) then translate to (cx,cy)
    el.setAttribute('transform',
      `translate(${cx - 400 * sc},${cy - 400 * sc}) scale(${sc.toFixed(6)})`);
    return el;
  }
}

function renderOrbit(svg, W, H, s) {
  // background
  svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill: s.bgColor }));

  const cx = W / 2, cy = H / 2;
  const freq  = s.frequency;
  const scale = s.scaleConstant;
  const rot   = s.rotationConstant;
  const sw    = s.baseStrokeWidth;
  const shape = s.shape;

  // Gradient defs (vertical, userSpaceOnUse, top→bottom, like original)
  const defs = svgEl('defs');
  const gradId = uid('ggg-grad');
  const grad = svgEl('linearGradient', {
    id: gradId,
    gradientUnits: 'userSpaceOnUse',
    x1: '0', y1: '0', x2: '0', y2: String(H)
  });
  grad.appendChild(svgEl('stop', { offset:'0%',   'stop-color': s.color1 }));
  grad.appendChild(svgEl('stop', { offset:'100%', 'stop-color': s.color2 }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  const strokeColor = s.fillType === 'gradient' ? `url(#${gradId})` : s.color1;

  // Draw from largest (i=freq) to smallest (i=1) — stroke-only, no fill
  for (let i = freq; i >= 1; i--) {
    const size = i * scale;
    const angleDeg = rot * i;

    // Per-shape opacity: fade = outermost (i=freq) transparent, innermost (i=1) opaque
    let shapeOpacity = s.opacity;
    if      (s.modOpacity === 'fade')    shapeOpacity = s.opacity * map(i, freq, 1, 0.05, 1);
    else if (s.modOpacity === 'fade-in') shapeOpacity = s.opacity * map(i, freq, 1, 1, 0.05);
    else if (s.modOpacity === 'random')  shapeOpacity = s.opacity * rnd(0.07, 1);

    const el = ggyrateMakeShapeEl(shape, size, cx, cy);
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', strokeColor);
    el.setAttribute('stroke-width', sw);
    el.setAttribute('opacity', shapeOpacity.toFixed(3));

    // Rotate each shape around canvas center
    const curTransform = el.getAttribute('transform') || '';
    el.setAttribute('transform',
      `rotate(${angleDeg.toFixed(3)},${cx},${cy})${curTransform ? ' ' + curTransform : ''}`);

    svg.appendChild(el);
  }
}

TOOLS.push({
  cat: 'Weave', slug: 'orbit', name: 'Orbit', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r="1.5"/></svg>',
  desc: 'Nested concentric shapes with incremental rotation',
  render: renderOrbit,
  controls: [
    { type:'color',    id:'bgColor',          label:'Background',   default:'#0d0d1a' },
    { type:'color',    id:'color1',            label:'Color 1',      default:'hsl(184,74%,44%)' },
    { type:'color',    id:'color2',            label:'Color 2',      default:'hsl(332,87%,70%)' },
    { type:'btngroup', id:'fillType',          label:'Fill type',    default:'gradient',
      options:['Gradient','Solid'], values:['gradient','solid'] },
    { type:'btngroup', id:'shape',             label:'Shape',        default:'rounded-hexagon',
      options:['Hex','Hex R','Tri','Tri R','Square'],
      values:['hexagon','rounded-hexagon','triangle','rounded-triangle','square'] },
    { type:'btngroup', id:'modOpacity',        label:'Opacity mode', default:'fade',
      options:['Fade ↓','Fade ↑','Random','Solid'],
      values:['fade','fade-in','random','opaque'] },
    { type:'range',    id:'frequency',         label:'Frequency',    default:22,  min:2,   max:55,  step:1 },
    { type:'range',    id:'rotationConstant',  label:'Rotation step',default:2,   min:0,   max:45,  step:0.5 },
    { type:'range',    id:'scaleConstant',     label:'Scale / size', default:33,  min:5,   max:125, step:1 },
    { type:'range',    id:'baseStrokeWidth',   label:'Stroke width', default:5,   min:1,   max:20,  step:0.5 },
    { type:'range',    id:'opacity',           label:'Opacity',      default:1,   min:0.1, max:1,   step:0.01 },
  ]
});
