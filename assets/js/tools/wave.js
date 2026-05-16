// ── 7. oooscillate — S-curve oscillating lines ──
// Original: draws `frequency` lines. Each line is at y = i * scaleConstant,
// drawn as double-quadratic-bezier S-curve:
//   M 0 y  Q (W×0.25) amp1  (W/2) (H/2)  Q (W×0.75) amp2  W y
// amp1 = map(amplitude, 0, 100, H/2, -100) — controls upper arc
// amp2 = map(amplitude, 0, 100, H/2, H+100) — controls lower arc
function renderWave(svg, W, H, s) {
  const defs = svgEl('defs');
  const gradId = uid('osc-grad');
  const grad = svgEl('linearGradient', {
    id: gradId, gradientUnits:'userSpaceOnUse',
    x1:'0', y1:'0', x2:'0', y2:String(H)
  });
  grad.appendChild(svgEl('stop', {'stop-color':s.color1, 'stop-opacity':'1', offset:'0%'}));
  grad.appendChild(svgEl('stop', {'stop-color':s.color2, 'stop-opacity':'1', offset:'100%'}));
  defs.appendChild(grad);
  svg.appendChild(defs);

  svg.appendChild(svgEl('rect',{x:0,y:0,width:W,height:H,fill:s.bgColor}));

  const freq      = s.frequency  || 26;   // number of lines
  const scaleC    = s.scaleConstant || 22; // spacing between lines
  const amp       = s.amplitude  || 100;  // 0–100
  const sw        = s.strokeWidth || 2;
  const modOp     = s.modOpacity || 'random';
  const maxRot    = s.maxRotate   || 0;
  const dashF     = s.dashFactor  || 0;

  // Amplitude maps: at amp=100 → strong S-curve; at 0 → flat
  const amp1 = map(amp, 0, 100, H/2, -100);       // upper control point Y
  const amp2 = map(amp, 0, 100, H/2, H + 100);    // lower control point Y

  const g = svgEl('g', {
    fill: 'none',
    stroke: `url(#${gradId})`,
    'stroke-width': sw,
    'stroke-linecap': s.lineCap || 'round'
  });
  svg.appendChild(g);

  // Draw from i=freq down to 1
  for (let i = freq; i >= 1; i--) {
    const y = i * scaleC;

    // opacity per modOpacity mode
    let opacity = 1;
    if      (modOp === 'random')  opacity = rnd(0.07, 1);
    else if (modOp === 'fade')    opacity = map(i, freq, 1, 1, 0.05);
    else if (modOp === 'fade-in') opacity = map(i, freq, 1, 0.05, 1);

    // S-curve: two quadratic beziers meeting at canvas center
    const d = `M 0 ${y} Q ${W * 0.25} ${amp1} ${W/2} ${H/2} Q ${W * 0.75} ${amp2} ${W} ${y}`;

    const attrs = {d, opacity: opacity.toFixed(3)};
    if (dashF > 0) attrs['stroke-dasharray'] = `${sw * dashF} ${sw * dashF * 1.5}`;

    // Optional per-line rotation (original has maxRotate param)
    let transform = '';
    if (maxRot > 0) {
      const rot = rnd(-maxRot, maxRot);
      transform = `rotate(${rot.toFixed(1)} ${W/2} ${H/2})`;
    }
    if (transform) attrs.transform = transform;

    g.appendChild(svgEl('path', attrs));
  }
}

TOOLS.push({
  cat: 'Flow', slug: 'wave', name: 'Wave', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10 Q6 4 10 10 T18 10"/></svg>',
  desc: 'S-curve oscillating lines',
  render: renderWave,
  controls: [
    { type:'color',    id:'bgColor',       label:'Background', default:'#ffffff' },
    { type:'color',    id:'color1',        label:'Color 1',    default:'hsl(206,75%,49%)' },
    { type:'color',    id:'color2',        label:'Color 2',    default:'hsl(331,90%,56%)' },
    { type:'btngroup', id:'modOpacity',    label:'Opacity',    default:'random', options:['Random','Fade↓','Fade↑','Solid'], values:['random','fade','fade-in',''] },
    { type:'btngroup', id:'lineCap',       label:'Line cap',   default:'round',  options:['Round','Butt','Square'], values:['round','butt','square'] },
    { type:'range',    id:'frequency',     label:'Lines',      default:26,  min:1,   max:60,  step:1 },
    { type:'range',    id:'scaleConstant', label:'Spacing',    default:22,  min:5,   max:80,  step:1 },
    { type:'range',    id:'amplitude',     label:'Amplitude',  default:100, min:0,   max:100, step:1 },
    { type:'range',    id:'strokeWidth',   label:'Stroke',     default:2,   min:0.5, max:12,  step:0.5 },
    { type:'range',    id:'maxRotate',     label:'Rotation',   default:0,   min:0,   max:180, step:1 },
    { type:'range',    id:'dashFactor',    label:'Dash',       default:0,   min:0,   max:10,  step:0.5 },
  ]
});
