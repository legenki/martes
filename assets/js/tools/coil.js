// ── 13. cccoil — spiral of dashed concentric arcs ──
// Original: i goes from `frequency` down to 1.
// r = i * scaleConstant / 2 (radius for ring i)
// percentValue = map(i, frequency, 1, maxLength, 0) — outer ring gets most arc
// dash = circumference * percentValue
// rotation = map(i, frequency, 1, 360, 0) rotated around center
function renderCoil(svg, W, H, s) {
  const defs = svgEl('defs');
  const gradId = uid('coil-grad');
  const grad = svgEl('linearGradient', {
    id:gradId, gradientUnits:'userSpaceOnUse',
    x1:'0', y1:'0', x2:'0', y2:String(H)
  });
  grad.appendChild(svgEl('stop', {'stop-color':s.color1, 'stop-opacity':'1', offset:'0%'}));
  grad.appendChild(svgEl('stop', {'stop-color':s.color2, 'stop-opacity':'1', offset:'100%'}));
  defs.appendChild(grad);
  svg.appendChild(defs);

  svg.appendChild(svgEl('rect', {x:0,y:0,width:W,height:H,fill:s.bgColor}));

  const cx = W/2, cy = H/2;
  const N         = s.rings        || 22;
  const scaleC    = s.spacing      || 33;   // scaleConstant: r = i * scaleC / 2
  const maxLen    = s.arcLength    || 0.85; // max fraction of circumference
  const sw        = s.strokeWidth  || 7;
  const direction = s.direction    || 1;    // 1=outer→inner fills more, 2=reverse
  const offset    = s.offsetAngle  || 0;
  const lineCap   = s.lineCap      || 'round';
  const modOp     = s.modOpacity   || 'fade';

  const g = svgEl('g', {fill:'none', stroke:`url(#${gradId})`, 'stroke-width':sw, 'stroke-linecap':lineCap});
  svg.appendChild(g);

  for (let i = N; i >= 1; i--) {
    const r = (i * scaleC) / 2;
    if (r <= 0) continue;

    const circ = 2 * Math.PI * r;

    // Arc fraction: outer (i=N) gets maxLen, inner (i=1) gets 0
    const percentValue = direction === 1
      ? map(i, N, 1, maxLen, 0)
      : map(i, N, 1, 0, maxLen);

    const dash = circ * percentValue;
    const gap  = circ * (1 - percentValue);

    // Rotation: map i from N→1 to 360→0 (creates coil spiral effect)
    const rotAngle = map(i, N, 1, 360, 0) + offset;

    // Opacity
    let opacity = 1;
    if      (modOp === 'fade')    opacity = map(i, N, 1, 0.05, 1);
    else if (modOp === 'fade-in') opacity = map(i, N, 1, 1, 0.05);
    else if (modOp === 'random')  opacity = rnd(0.07, 1);

    const circle = svgEl('circle', {
      cx, cy, r,
      'stroke-dasharray': `${dash.toFixed(2)} ${gap.toFixed(2)}`,
      transform: `rotate(${rotAngle.toFixed(2)} ${cx} ${cy})`,
      opacity: opacity.toFixed(3)
    });
    g.appendChild(circle);
  }
}

TOOLS.push({
  cat: 'Form', slug: 'coil', name: 'Coil', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10 A1 1 0 0 1 11 10 A2 2 0 0 1 9 11 A3 3 0 0 1 9 7 A4 4 0 0 1 13 11 A5 5 0 0 1 7 13 A6 6 0 0 1 5 7"/></svg>',
  desc: 'Spiral of dashed concentric arcs',
  render: renderCoil,
  controls: [
    { type:'color',    id:'bgColor',     label:'Background',  default:'#0d0d1a' },
    { type:'color',    id:'color1',      label:'Color top',   default:'hsl(206,75%,49%)' },
    { type:'color',    id:'color2',      label:'Color bottom',default:'hsl(331,90%,56%)' },
    { type:'btngroup', id:'modOpacity',  label:'Opacity',     default:'fade', options:['Fade↓','Fade↑','Random','Solid'], values:['fade','fade-in','random',''] },
    { type:'btngroup', id:'lineCap',     label:'Line cap',    default:'round', options:['Round','Butt','Square'], values:['round','butt','square'] },
    { type:'btngroup', id:'direction',   label:'Fill dir',    default:1, options:['Out→In','In→Out'], values:[1,2] },
    { type:'range',    id:'rings',       label:'Rings',       default:22,   min:5,   max:55,   step:1 },
    { type:'range',    id:'spacing',     label:'Scale',       default:33,   min:5,   max:120,  step:1 },
    { type:'range',    id:'arcLength',   label:'Arc length',  default:0.85, min:0.0, max:1.0,  step:0.01 },
    { type:'range',    id:'strokeWidth', label:'Stroke',      default:7,    min:1,   max:25,   step:0.5 },
    { type:'range',    id:'offsetAngle', label:'Offset angle',default:0,    min:0,   max:360,  step:1 },
  ]
});
