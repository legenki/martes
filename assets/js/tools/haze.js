// ── 3. bbblurry — blurry blob shapes ──────────────────────
function renderHaze(svg, W, H, s) {
  s.colors = [s.c0, s.c1, s.c2];

  const defs = svgEl('defs');
  const filterId = uid('blur');
  const filter = svgEl('filter', {
    id: filterId, x:'-50%', y:'-50%', width:'200%', height:'200%',
    filterUnits:'objectBoundingBox', primitiveUnits:'userSpaceOnUse',
    'color-interpolation-filters':'sRGB'
  });
  const blur = svgEl('feGaussianBlur', {
    stdDeviation: s.blurAmount, x:'0%', y:'0%', width:'100%', height:'100%',
    in:'SourceGraphic', edgeMode:'none', result:'blur'
  });
  filter.appendChild(blur);
  defs.appendChild(filter);
  svg.appendChild(defs);

  const bg = svgEl('rect',{x:0,y:0,width:W,height:H,fill:s.bgColor});
  svg.appendChild(bg);

  const g = svgEl('g', {filter:`url(#${filterId})`, opacity: s.opacity});
  svg.appendChild(g);

  s.colors.forEach((color, i) => {
    const cx = rnd(W*0.1, W*0.9);
    const cy = rnd(H*0.1, H*0.9);
    const rx = s.sizeX;
    const ry = s.sizeY;
    const el = svgEl('ellipse', {cx, cy, rx, ry, fill:color});
    g.appendChild(el);
  });
}

TOOLS.push({
  cat: 'Field', slug: 'haze', name: 'Haze', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="11" r="4" opacity="0.6"/><circle cx="13" cy="9" r="4" opacity="0.6"/><circle cx="10" cy="14" r="3" opacity="0.6"/></svg>',
  desc: 'Blurry gradient blob shapes',
  render: renderHaze,
  controls: [
    { type:'color',  id:'bgColor',    label:'Background', default:'#0f0f1a' },
    { type:'color',  id:'c0',         label:'Blob 1',     default:'#e8672b' },
    { type:'color',  id:'c1',         label:'Blob 2',     default:'#c43d8a' },
    { type:'color',  id:'c2',         label:'Blob 3',     default:'#2ab8d4' },
    { type:'range',  id:'blurAmount', label:'Blur',       default:120, min:20, max:250, step:5 },
    { type:'range',  id:'sizeX',      label:'Width',      default:350, min:80, max:600, step:10 },
    { type:'range',  id:'sizeY',      label:'Height',     default:350, min:80, max:600, step:10 },
    { type:'range',  id:'opacity',    label:'Opacity',    default:1,   min:0.1,max:1,   step:0.05 },
  ]
});
