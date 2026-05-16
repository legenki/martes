// ── 17. ssscribble — concentric circles warped by sine (Warp.js method) ──
// Original: draws `lines` concentric circles, each at radius i * scaleConstant,
// then applies Warp distortion: x + scribble·sin(y/rand1), y + scribble·sin(x/rand2)
// rand1/rand2 = random integers 24–64 (fixed per render)
function renderWhorl(svg, W, H, s) {
  const defs = svgEl('defs');
  const gradId = uid('scrib-grad');
  const grad = svgEl('linearGradient', {
    id: gradId, gradientUnits:'userSpaceOnUse',
    x1:'0', y1:'0', x2:'0', y2:String(H)
  });
  grad.appendChild(svgEl('stop', {'stop-color':s.color1, 'stop-opacity':'1', offset:'0%'}));
  grad.appendChild(svgEl('stop', {'stop-color':s.color2, 'stop-opacity':'1', offset:'100%'}));
  defs.appendChild(grad);
  svg.appendChild(defs);

  svg.appendChild(svgEl('rect', {x:0,y:0,width:W,height:H,fill:s.bgColor}));

  const cx = W / 2, cy = H / 2;
  const lines       = s.lines || 14;
  const scaleConst  = s.spacing || 60;       // radius step
  const scribble    = s.chaos || 220;        // warp amplitude
  const sw          = s.strokeWidth || 1.5;
  const dashGap     = s.dashGap || 0;
  const opacity     = s.opacity || 1;

  // Fixed random warp coefficients per render (like original)
  const rand1 = rndInt(24, 64);
  const rand2 = rndInt(24, 64);

  // Sample circle as many polyline points, apply warp, output as path
  const SAMPLES = 360; // one point per degree — smooth enough

  const g = svgEl('g', {
    fill: 'none',
    stroke: `url(#${gradId})`,
    'stroke-width': sw,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    opacity: String(opacity)
  });
  svg.appendChild(g);

  // Draw from i=lines down to 2 (matching original: from outer to inner)
  for (let i = lines; i >= 2; i--) {
    const r = i * scaleConst;

    // Sample circle, apply sine warp
    const pts = [];
    for (let j = 0; j <= SAMPLES; j++) {
      const theta = (j / SAMPLES) * Math.PI * 2;
      const ox = cx + r * Math.cos(theta);
      const oy = cy + r * Math.sin(theta);
      // Warp.js formula: x + scribble*sin(y/rand1), y + scribble*sin(x/rand2)
      const wx = ox + scribble * Math.sin(oy / rand1);
      const wy = oy + scribble * Math.sin(ox / rand2);
      pts.push([wx, wy]);
    }

    // Build path as series of line segments (Warp.js outputs polyline)
    let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let j = 1; j < pts.length; j++) {
      d += ` L ${pts[j][0].toFixed(2)} ${pts[j][1].toFixed(2)}`;
    }
    d += ' Z';

    const dashArr = dashGap > 0 ? `${sw * 3} ${dashGap}` : 'none';
    const path = svgEl('path', {d, 'stroke-dasharray': dashArr});
    g.appendChild(path);
  }
}

TOOLS.push({
  cat: 'Flow', slug: 'whorl', name: 'Whorl', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4 C7 4 4 7 4 10 C4 13 7 16 10 16 C12 16 14 14 14 12 C14 10 12 8 10 8 C9 8 8 9 8 10 C8 11 9 12 10 12"/></svg>',
  desc: 'Concentric circles with sine-warp scribble distortion',
  render: renderWhorl,
  controls: [
    { type:'color',    id:'bgColor',     label:'Background', default:'#ffffff' },
    { type:'color',    id:'color1',      label:'Color top',  default:'hsl(206,75%,49%)' },
    { type:'color',    id:'color2',      label:'Color btm',  default:'hsl(331,90%,56%)' },
    { type:'btngroup', id:'modOpacity',  label:'Opacity',    default:'random', options:['Random','Fade↓','Fade↑','Solid'], values:['random','fade','fade-in',''] },
    { type:'range',    id:'lines',       label:'Lines',      default:14,   min:2,   max:30,   step:1 },
    { type:'range',    id:'spacing',     label:'Ring size',  default:68,   min:10,  max:200,  step:1 },
    { type:'range',    id:'chaos',       label:'Scribble',   default:227,  min:0,   max:600,  step:5 },
    { type:'range',    id:'strokeWidth', label:'Stroke',     default:1.5,  min:0.5, max:6,    step:0.25 },
    { type:'range',    id:'dashGap',     label:'Dash gap',   default:0,    min:0,   max:150,  step:5 },
    { type:'range',    id:'opacity',     label:'Opacity',    default:1,    min:0.1, max:1,    step:0.05 },
  ]
});
