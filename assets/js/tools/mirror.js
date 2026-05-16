// ── 20. rrreflection — 4-group concentric circles from edges ──
function renderMirror(svg, W, H, s) {
  const defs = svgEl('defs');
  // 4 gradients — top, bottom, left, right groups
  const configs = [
    { id:'ref-g0', cx: W/2, cy: 0,   x1:'0%',y1:'0%',   x2:'0%',y2:'100%', flip:false },
    { id:'ref-g1', cx: W/2, cy: H,   x1:'0%',y1:'100%', x2:'0%',y2:'0%',   flip:true  },
    { id:'ref-g2', cx: 0,   cy: H/2, x1:'0%',y1:'0%',   x2:'100%',y2:'0%', flip:false },
    { id:'ref-g3', cx: W,   cy: H/2, x1:'100%',y1:'0%', x2:'0%',y2:'0%',   flip:true  },
  ];
  configs.forEach(({id, flip}) => {
    const lg = svgEl('linearGradient', {id, x1:'0%',y1:'0%',x2:'0%',y2:'100%'});
    const [c1,c2] = flip ? [s.color2,s.color1] : [s.color1,s.color2];
    lg.appendChild(svgEl('stop', {'stop-color':c1, offset:'40%'}));
    lg.appendChild(svgEl('stop', {'stop-color':c2, offset:'100%'}));
    defs.appendChild(lg);
  });
  svg.appendChild(defs);

  const bg = svgEl('rect', {x:0,y:0,width:W,height:H,fill:s.bgColor});
  svg.appendChild(bg);

  const N = s.rings;
  const step = s.spacing;
  const maxR = N * step;

  configs.forEach(({id, cx, cy}) => {
    const g = svgEl('g', {fill:'none', stroke:`url(#${id})`, 'stroke-width':s.strokeWidth, opacity:s.opacity});
    svg.appendChild(g);
    for (let i = N; i >= 1; i--) {
      const r = i * step;
      g.appendChild(svgEl('circle', {cx, cy, r}));
    }
  });
}

TOOLS.push({
  cat: 'Form', slug: 'mirror', name: 'Mirror', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 A7 7 0 0 0 10 17"/><path d="M10 3 A7 7 0 0 1 10 17"/><path d="M10 3 L10 17" stroke-dasharray="1.5 2"/></svg>',
  desc: 'Reflected concentric circles from edges',
  render: renderMirror,
  controls: [
    { type:'color', id:'bgColor',     label:'Background', default:'#0a0a0a' },
    { type:'color', id:'color1',      label:'Color 1',    default:'#00b4d8' },
    { type:'color', id:'color2',      label:'Color 2',    default:'#ef233c' },
    { type:'range', id:'rings',       label:'Rings',      default:30,  min:5,   max:80,  step:1 },
    { type:'range', id:'spacing',     label:'Spacing',    default:18,  min:5,   max:60,  step:1 },
    { type:'range', id:'strokeWidth', label:'Stroke',     default:2,   min:0.5, max:12,  step:0.5 },
    { type:'range', id:'opacity',     label:'Opacity',    default:1,   min:0.1, max:1,   step:0.05 },
  ]
});
