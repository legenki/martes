// ── uuundulate — Catmull-Rom concentric blobs ──────────────────
//
// Algorithm:
//   Random blob shape (Catmull-Rom → cubic bezier, tension=1.25)
//   frequency concentric scaled copies centered on canvas
//   Linear gradient fill
//
function renderBloom(svg, W, H, s) {
  const bgColor   = s.bgColor    || 'none';
  const freq      = s.frequency  ?? 22;
  const fillType  = s.fillType   || 'gradient';
  const color1    = s.fills ? s.fills[0] : (s.color1 || 'hsl(37,99%,67%)');
  const color2    = s.fills ? s.fills[1] : (s.color2 || 'hsl(316,73%,52%)');
  const fillSolid = s.fill       || 'hsl(32,100%,51%)';
  const scaleC    = s.scaleConstant ?? 25;
  const sw        = s.strokeWidth ?? 2;
  const opacity   = s.opacity    ?? 1;

  if (bgColor && bgColor !== 'none') {
    svg.appendChild(svgEl('rect', {x:0,y:0,width:W,height:H,fill:bgColor}));
  }

  const uid    = 'uuu-' + Math.random().toString(36).slice(2,8);
  const gradId = uid + '-g';
  const defs   = svgEl('defs');

  if (fillType === 'gradient') {
    const grad = svgEl('linearGradient', {id:gradId, x1:'50%', y1:'0%', x2:'50%', y2:'100%'});
    const st1 = svgEl('stop', {'stop-color':color1, offset:'45%'});
    const st2 = svgEl('stop', {'stop-color':color2, offset:'100%'});
    grad.appendChild(st1); grad.appendChild(st2);
    defs.appendChild(grad);
  }
  svg.appendChild(defs);

  // Generate random blob points
  const numPoints = rndInt(4, 8);
  const angleStep = (Math.PI * 2) / numPoints;
  const baseSize  = 30; // hardcoded per original

  const pts = [];
  for (let i = 0; i < numPoints; i++) {
    const pull = rnd(0.5, 2);
    pts.push({
      x: W / 2 + Math.cos(i * angleStep) * baseSize * pull,
      y: H / 2 + Math.sin(i * angleStep) * baseSize * pull
    });
  }

  // Catmull-Rom to cubic bezier with tension=1.25
  function catmullToBezier(pts, tension) {
    const n = pts.length;
    let d = '';
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      if (i === 0) d += `M ${p1.x.toFixed(2)},${p1.y.toFixed(2)} `;
      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
      d += `C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)} `;
    }
    d += 'Z';
    return d;
  }

  const basePath = catmullToBezier(pts, 1.25);
  const cx = W / 2, cy = H / 2;
  const fillVal = fillType === 'gradient' ? `url(#${gradId})` : fillSolid;

  // Draw from largest to smallest (freq down to 1)
  for (let i = freq; i >= 1; i--) {
    const sc = (i * scaleC) / baseSize;
    const attrs = {
      d: basePath,
      transform: `translate(${cx},${cy}) scale(${sc.toFixed(4)}) translate(${-cx},${-cy})`,
      fill: fillVal,
      stroke: 'none',
      opacity: String(opacity)
    };
    svg.appendChild(svgEl('path', attrs));
  }
}

TOOLS.push({
  cat: 'Form', slug: 'bloom', name: 'Bloom', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 Q14 7 10 10 Q6 7 10 3 Z"/><path d="M17 10 Q13 14 10 10 Q13 6 17 10 Z"/><path d="M10 17 Q6 13 10 10 Q14 13 10 17 Z"/><path d="M3 10 Q7 6 10 10 Q7 14 3 10 Z"/></svg>',
  desc: 'Catmull-Rom concentric blobs',
  render: renderBloom,
  controls: [
    { type:'color',    id:'bgColor',       label:'Background',  default:'none' },
    { type:'color',    id:'color1',        label:'Color 1',     default:'hsl(37,99%,67%)' },
    { type:'color',    id:'color2',        label:'Color 2',     default:'hsl(316,73%,52%)' },
    { type:'btngroup', id:'fillType',      label:'Fill',        default:'gradient',
      options:['Gradient','Solid'], values:['gradient','solid'] },
    { type:'color',    id:'fill',          label:'Solid color', default:'hsl(32,100%,51%)' },
    { type:'range',    id:'frequency',     label:'Rings',       default:22,  min:11,  max:77,   step:1 },
    { type:'range',    id:'scaleConstant', label:'Size',        default:25,  min:10,  max:150,  step:1 },
    { type:'range',    id:'strokeWidth',   label:'Stroke',      default:2,   min:1,   max:11,   step:0.5 },
    { type:'range',    id:'opacity',       label:'Opacity',     default:1,   min:0.1, max:1,    step:0.05 },
  ]
});
