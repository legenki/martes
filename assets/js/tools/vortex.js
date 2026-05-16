// ── 9. vvvortex — dashed concentric circles with random rotation ──
// Original: frequency concentric circles. Each has:
//   r = i * scaleConstant / 2
//   random stroke-dasharray (dash/gap based on stroke width)
//   random rotation 0–360° around center
//   stroke-width tapers: outer=sw+4, inner=sw-2
//   modOpacity for fade effects
function renderVortex(svg, W, H, s) {
  const defs = svgEl('defs');
  const gradId = uid('vor-grad');
  const grad = svgEl('linearGradient', {
    id:gradId, gradientUnits:'userSpaceOnUse',
    x1:'0', y1:'0', x2:'0', y2:String(H)
  });
  grad.appendChild(svgEl('stop', {'stop-color':s.color1, 'stop-opacity':'1', offset:'0%'}));
  grad.appendChild(svgEl('stop', {'stop-color':s.color2, 'stop-opacity':'1', offset:'100%'}));
  defs.appendChild(grad);
  svg.appendChild(defs);

  svg.appendChild(svgEl('rect',{x:0,y:0,width:W,height:H,fill:s.bgColor}));

  const cx = W/2, cy = H/2;
  const freq      = s.frequency     || 22;
  const scaleC    = s.scaleConstant || 33;
  const baseSW    = s.baseStrokeWidth || 7;
  const modOp     = s.modOpacity    || 'fade';
  const lineCap   = s.lineCap       || 'round';

  const strokeColor = s.fillType === 'solid' ? s.color1 : `url(#${gradId})`;

  const g = svgEl('g', {fill:'none', 'stroke-linecap':lineCap});
  svg.appendChild(g);

  for (let i = freq; i >= 1; i--) {
    const r = (i * scaleC) / 2;
    if (r <= 0) continue;

    // Stroke width: tapers from outer (thicker) to inner (thinner)
    const sw = map(i, freq, 1, baseSW + 4, Math.max(0.5, baseSW - 2));

    // Random dash/gap based on stroke width (like original)
    const dashMin = baseSW >= 12 ? 30 : 10;
    const dashMax = baseSW >= 12 ? 77 : 55;
    const dashVal = rnd(dashMin, dashMax);
    const gapVal  = rnd(dashMin, dashMax);

    // Random rotation per ring
    const rotAngle = rnd(0, 360);

    // Opacity
    let opacity = 1;
    if      (modOp === 'fade')    opacity = map(i, freq, 1, 0.05, 1);
    else if (modOp === 'fade-in') opacity = map(i, freq, 1, 1, 0.05);
    else if (modOp === 'random')  opacity = rnd(0.07, 1);

    g.appendChild(svgEl('circle', {
      cx, cy, r,
      stroke: strokeColor,
      'stroke-width': sw.toFixed(2),
      'stroke-dasharray': `${dashVal.toFixed(1)} ${gapVal.toFixed(1)}`,
      transform: `rotate(${rotAngle.toFixed(1)} ${cx} ${cy})`,
      opacity: opacity.toFixed(3)
    }));
  }
}

TOOLS.push({
  cat: 'Form', slug: 'vortex', name: 'Vortex', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 A7 7 0 1 1 3 10 A4 4 0 1 1 10 6 A1.5 1.5 0 1 1 11.5 10"/></svg>',
  desc: 'Dashed concentric rings with random rotation',
  render: renderVortex,
  controls: [
    { type:'color',    id:'bgColor',          label:'Background',   default:'#0d0d1a' },
    { type:'color',    id:'color1',            label:'Color top',    default:'hsl(184,74%,44%)' },
    { type:'color',    id:'color2',            label:'Color bottom', default:'hsl(332,87%,70%)' },
    { type:'btngroup', id:'fillType',          label:'Fill type',   default:'gradient', options:['Gradient','Solid'], values:['gradient','solid'] },
    { type:'btngroup', id:'modOpacity',        label:'Opacity',     default:'fade', options:['Fade↓','Fade↑','Random','Solid'], values:['fade','fade-in','random',''] },
    { type:'btngroup', id:'lineCap',           label:'Line cap',    default:'round', options:['Round','Butt','Square'], values:['round','butt','square'] },
    { type:'range',    id:'frequency',         label:'Rings',       default:22,  min:2,  max:55,  step:1 },
    { type:'range',    id:'scaleConstant',     label:'Scale',       default:33,  min:5,  max:120, step:1 },
    { type:'range',    id:'baseStrokeWidth',   label:'Stroke',      default:7,   min:1,  max:25,  step:0.5 },
  ]
});
