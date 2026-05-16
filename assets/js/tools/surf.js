// ── 4. sssurf — wave generator ──
function renderSurf(svg, W, H, s) {
  const defs = svgEl('defs');
  let fill;

  if (s.fillType === 'gradient') {
    const gradId = uid('surf-grad');
    const grad = svgEl('linearGradient', {id:gradId, x1:'50%',y1:'0%',x2:'50%',y2:'100%'});
    grad.appendChild(svgEl('stop', {'stop-color':s.color1,'stop-opacity':'1',offset:'0%'}));
    grad.appendChild(svgEl('stop', {'stop-color':s.color2,'stop-opacity':'1',offset:'100%'}));
    defs.appendChild(grad);
    fill = `url(#${gradId})`;
  } else {
    fill = s.solidColor;
  }
  svg.appendChild(defs);

  svg.appendChild(svgEl('rect',{x:0,y:0,width:W,height:H,fill:s.bgColor}));

  const freq    = s.frequency;
  const nPts    = s.numPoints || 12;
  const maxAmp  = s.maxAmplitude || 50;
  const spacing = s.scaleConstant || 35;
  const style   = Number(s.style) || 4;
  const step    = W / nPts;

  // Build wave path per layer. Style controls how control points are placed.
  function buildWavePath(baseY) {
    if (style === 1) {
      // Style 1: alternating up/down points, spline via midpoints
      const pts = [];
      for (let j = 0; j <= nPts; j++) {
        const x = j * step;
        const yOff = j % 2 === 0 ? rnd(10, maxAmp) : rnd(-maxAmp, -10);
        pts.push([x, baseY + yOff]);
      }
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let j = 0; j < pts.length - 1; j++) {
        const mx = (pts[j][0] + pts[j+1][0]) / 2;
        const my = (pts[j][1] + pts[j+1][1]) / 2;
        d += ` Q ${pts[j][0]} ${pts[j][1]} ${mx} ${my}`;
      }
      return d;
    } else if (style === 2) {
      // Style 2: quadratic bezier, center pull at H/2
      const pullY = H * 0.5;
      let d = `M 0 ${baseY}`;
      for (let j = 0; j < nPts; j++) {
        const x0 = j * step, x1 = (j+1) * step;
        const cx = (x0 + x1) / 2 + rnd(-step*0.4, step*0.4);
        d += ` Q ${cx} ${pullY} ${x1} ${baseY}`;
      }
      return d;
    } else if (style === 3) {
      // Style 3: quadratic bezier, symmetric control at H/2 exact
      const pullY = H * 0.5;
      let d = `M 0 ${baseY}`;
      for (let j = 0; j < nPts; j++) {
        const x1 = (j+1) * step;
        const cx = j * step + step/2;
        d += ` Q ${cx} ${pullY} ${x1} ${baseY}`;
      }
      return d;
    } else {
      // Style 4 (default): quadratic bezier, control at random (H/2 + random offset)
      let d = `M 0 ${baseY}`;
      for (let j = 0; j < nPts; j++) {
        const x1 = (j+1) * step;
        const cx = j * step + step/2;
        const cy = H * 0.5 + rnd(0, maxAmp * 0.6);
        d += ` Q ${cx} ${cy} ${x1} ${baseY}`;
      }
      return d;
    }
  }

  for (let i = freq; i >= 1; i--) {
    const layerOpacity = map(i, freq, 1, 0.15, 1);
    const baseY = H - (i * spacing);
    const waveD = buildWavePath(baseY);
    const d = waveD + ` L ${W} ${H + 10} L 0 ${H + 10} Z`;

    svg.appendChild(svgEl('path', {
      d, fill, opacity: layerOpacity, 'fill-rule':'nonzero'
    }));
  }
}

TOOLS.push({
  cat: 'Flow', slug: 'surf', name: 'Surf', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 14 Q6 8 10 12 T18 10"/><path d="M2 17 L18 17"/></svg>',
  desc: 'Stacked bezier wave layers',
  render: renderSurf,
  controls: [
    { type:'color',    id:'bgColor',      label:'Background', default:'#001220' },
    { type:'btngroup', id:'fillType',     label:'Fill type',  default:'gradient', options:['Gradient','Solid'], values:['gradient','solid'] },
    { type:'color',    id:'color1',       label:'Color 1',    default:'hsl(208,77%,50%)' },
    { type:'color',    id:'color2',       label:'Color 2',    default:'hsl(208,74%,93%)' },
    { type:'color',    id:'solidColor',   label:'Solid color',default:'hsl(32,100%,51%)' },
    { type:'btngroup', id:'style',        label:'Wave style', default:4, options:['1','2','3','4'], values:[1,2,3,4] },
    { type:'range',    id:'frequency',    label:'Layers',     default:7,  min:1,  max:20, step:1 },
    { type:'range',    id:'scaleConstant',label:'Spacing',    default:35, min:5,  max:150,step:5 },
    { type:'range',    id:'numPoints',    label:'Points',     default:12, min:3,  max:30, step:1 },
    { type:'range',    id:'maxAmplitude', label:'Amplitude',  default:50, min:5,  max:200,step:5 },
  ]
});
