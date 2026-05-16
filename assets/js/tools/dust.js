// ── 5. nnnoise — SVG noise texture ────────
function renderDust(svg, W, H, s) {
  const defs = svgEl('defs');
  const filterId = uid('noise');

  // Original uses feDistantLight (not fePointLight), azimuth=3, stitchTiles='stitch'
  const filter = svgEl('filter', {id:filterId, x:'0%',y:'0%',width:'100%',height:'100%', 'color-interpolation-filters':'sRGB'});
  const turb = svgEl('feTurbulence', {
    type: s.fractal ? 'fractalNoise' : 'turbulence',
    baseFrequency: s.frequency,
    numOctaves: s.octaves,
    seed: String(rndInt(0, 999)),
    stitchTiles: 'stitch',
    result: 'noise'
  });
  const spec = svgEl('feSpecularLighting', {
    in: 'noise', 'lighting-color': s.lightColor,
    surfaceScale: s.surfaceScale,
    specularConstant: s.specular,
    specularExponent: '20',
    result: 'specOut'
  });
  // feDistantLight — azimuth=3 (original default), elevation from slider
  const distLight = svgEl('feDistantLight', {
    azimuth: '3',
    elevation: s.elevation
  });
  spec.appendChild(distLight);

  const comp  = svgEl('feComposite', {in:'specOut', in2:'SourceAlpha', operator:'in', result:'litOut'});
  const blend = svgEl('feBlend', {in:'SourceGraphic', in2:'litOut', mode:'screen'});

  filter.appendChild(turb); filter.appendChild(spec); filter.appendChild(comp); filter.appendChild(blend);

  // Optional desaturate pass
  if (s.desaturate) {
    const desat = svgEl('feColorMatrix', {type:'saturate', values:'0'});
    filter.appendChild(desat);
  }

  defs.appendChild(filter);
  svg.appendChild(defs);

  svg.appendChild(svgEl('rect',{x:0,y:0,width:W,height:H,fill:s.bgColor}));
  svg.appendChild(svgEl('rect',{x:0,y:0,width:W,height:H,fill:s.fgColor || s.bgColor,filter:`url(#${filterId})`,opacity:s.opacity}));
}

TOOLS.push({
  cat: 'Weave', slug: 'dust', name: 'Dust', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="0.6" fill="currentColor"/><circle cx="14" cy="4" r="0.6" fill="currentColor"/><circle cx="10" cy="10" r="0.6" fill="currentColor"/><circle cx="4" cy="14" r="0.6" fill="currentColor"/><circle cx="15" cy="15" r="0.6" fill="currentColor"/><circle cx="7" cy="16" r="0.6" fill="currentColor"/><circle cx="16" cy="10" r="0.6" fill="currentColor"/><rect x="2.5" y="2.5" width="15" height="15"/></svg>',
  desc: 'SVG noise & specular lighting texture',
  render: renderDust,
  controls: [
    { type:'color',    id:'bgColor',      label:'Background',    default:'#7957A8' },
    { type:'color',    id:'fgColor',      label:'Foreground',    default:'#7957A8' },
    { type:'color',    id:'lightColor',   label:'Light color',   default:'#ffffff' },
    { type:'btngroup', id:'fractal',      label:'Noise type',    default:true, options:['Fractal','Turbulence'], values:[true, false] },
    { type:'toggle',   id:'desaturate',   label:'Desaturate',    default:false },
    { type:'range',    id:'frequency',    label:'Frequency',     default:0.102, min:0.001, max:0.5,  step:0.001 },
    { type:'range',    id:'octaves',      label:'Octaves',       default:4,     min:1,     max:8,    step:1 },
    { type:'range',    id:'surfaceScale', label:'Surface scale', default:15,    min:1,     max:50,   step:1 },
    { type:'range',    id:'elevation',    label:'Elevation',     default:100,   min:0,     max:180,  step:1 },
    { type:'range',    id:'specular',     label:'Specular',      default:0.75,  min:0.1,   max:5,    step:0.05 },
    { type:'range',    id:'opacity',      label:'Opacity',       default:1,     min:0.1,   max:1,    step:0.05 },
  ]
});
