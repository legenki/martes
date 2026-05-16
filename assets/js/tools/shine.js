// ── 21. tttwinkle — starburst/radial lines all crossing canvas center ──
// Original algorithm:
//   rotationFactor = round(360 / frequency)
//   For each line i: random length in [minLength, maxLength],
//   draw horizontal line centered on canvas: from (W - length/2, H/2) to (length/2, H/2)
//   rotate by i * rotationFactor degrees around (W/2, H/2)
//   Random or solid opacity per line
//   Optional dash: stroke-dasharray = "dashFactor gapFactor"
function renderShine(svg, W, H, s) {
  svg.appendChild(svgEl('rect', {x:0, y:0, width:W, height:H, fill:s.bgColor}));

  const freq      = s.frequency     || 88;
  const minLen    = s.minLength      || 111;
  const maxLen    = s.maxLength      || 1555;
  const sw        = s.strokeWidth    || 3;
  const lineCap   = s.lineCap        || 'round';
  const modOp     = s.modOpacity     || 'random';
  const scaleC    = s.scaleConstant  ?? 1;
  const dashF     = s.dashFactor     || 0;
  const gapF      = s.gapFactor      || 0;
  const opacity   = s.opacity        || 1;

  // Exact original: rotationFactor = Math.round(360 / frequency)
  const rotStep = Math.round(360 / freq);
  const cx = W / 2, cy = H / 2;

  // Inner group carries stroke styling + optional dash
  const gAttrs = {
    fill: 'none',
    stroke: s.color,
    'stroke-width': sw,
    'stroke-linecap': lineCap,
    opacity: String(opacity)
  };
  if (dashF > 0 || gapF > 0) {
    gAttrs['stroke-dasharray'] = `${dashF} ${gapF}`;
  }
  const g = svgEl('g', gAttrs);

  // Outer wrapper handles optional scale (separate from rotation per-line)
  if (scaleC !== 1) {
    const wrapper = svgEl('g', {
      transform: `translate(${cx},${cy}) scale(${scaleC}) translate(${-cx},${-cy})`
    });
    wrapper.appendChild(g);
    svg.appendChild(wrapper);
  } else {
    svg.appendChild(g);
  }

  for (let i = 0; i < freq; i++) {
    const length = Math.round(rnd(minLen, maxLen));
    // Horizontal line centered on canvas: from (W - length/2, H/2) to (length/2, H/2)
    // Both endpoints equidistant from center → line always passes through (cx, cy)
    const x1 = W - length / 2;
    const x2 = length / 2;
    const lineOpacity = modOp === 'random' ? rnd(0.07, 1).toFixed(2) : null;

    const attrs = {
      x1: x1.toFixed(2), y1: cy.toFixed(2),
      x2: x2.toFixed(2), y2: cy.toFixed(2),
      transform: `rotate(${i * rotStep} ${cx} ${cy})`
    };
    if (lineOpacity !== null) attrs.opacity = lineOpacity;

    g.appendChild(svgEl('line', attrs));
  }
}

TOOLS.push({
  cat: 'Flow', slug: 'shine', name: 'Shine', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 1 L10 19 M1 10 L19 10 M3.5 3.5 L16.5 16.5 M16.5 3.5 L3.5 16.5"/></svg>',
  desc: 'Starburst radial lines — all crossing canvas center',
  render: renderShine,
  controls: [
    { type:'color',    id:'bgColor',       label:'Background',  default:'#0d0d1a' },
    { type:'color',    id:'color',         label:'Line color',  default:'hsl(335,77%,50%)' },
    { type:'btngroup', id:'modOpacity',    label:'Opacity',     default:'random', options:['Random','Solid'], values:['random',''] },
    { type:'btngroup', id:'lineCap',       label:'Line cap',    default:'round',  options:['Round','Square','Butt'], values:['round','square','butt'] },
    { type:'range',    id:'frequency',     label:'Lines',       default:88,   min:5,    max:333,  step:1 },
    { type:'range',    id:'minLength',     label:'Min length',  default:111,  min:1,    max:1200, step:1 },
    { type:'range',    id:'maxLength',     label:'Max length',  default:1555, min:333,  max:3333, step:1 },
    { type:'range',    id:'strokeWidth',   label:'Stroke',      default:3,    min:0.5,  max:70,   step:0.25 },
    { type:'range',    id:'scaleConstant', label:'Scale',       default:1,    min:0.2,  max:3,    step:0.1 },
    { type:'range',    id:'dashFactor',    label:'Dash',        default:0,    min:0,    max:125,  step:0.5 },
    { type:'range',    id:'gapFactor',     label:'Gap',         default:0,    min:0,    max:125,  step:0.5 },
    { type:'range',    id:'opacity',       label:'Opacity',     default:1,    min:0.1,  max:1,    step:0.01 },
  ]
});
