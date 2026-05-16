// ── ffflux — SVG filter noise gradient ────────────────────────
//
// Algorithm:
//   feTurbulence → feGaussianBlur → feBlend → optional feColorMatrix saturate
//   Linear or radial gradient rect as SourceGraphic
//
function renderFlux(svg, W, H, s) {
  const color1   = s.color1   || 'hsl(200,90%,50%)';
  const color2   = s.color2   || 'hsl(320,80%,55%)';
  const freqX    = s.freqX    ?? 0.005;
  const freqY    = s.freqY    ?? 0.003;
  const octaves  = s.octaves  ?? 2;
  const seed     = s.seed     ?? 2;
  const blurX    = s.blurX    ?? 20;
  const blurY    = s.blurY    ?? 0;
  const mode     = s.blendMode || 'color-dodge';
  const saturate = s.saturate ?? false;
  const satVal   = s.satValue ?? 3;
  const angle    = s.angle    ?? 150;
  const linear   = s.linear   ?? true;
  const opacity  = s.opacity  ?? 1;
  const bgColor  = s.bgColor  || '#000000';

  svg.appendChild(svgEl('rect', {x:0,y:0,width:W,height:H,fill:bgColor}));

  const uid = 'ffflux-' + Math.random().toString(36).slice(2,8);
  const filterId = uid + '-f';
  const gradId   = uid + '-g';

  const defs = svgEl('defs');

  // Gradient
  let grad;
  if (linear) {
    const rad = angle * Math.PI / 180;
    // Convert angle to gradient vector on [0,1] space
    const x1p = (50 + 50 * Math.cos(rad + Math.PI)).toFixed(1) + '%';
    const y1p = (50 + 50 * Math.sin(rad + Math.PI)).toFixed(1) + '%';
    const x2p = (50 + 50 * Math.cos(rad)).toFixed(1) + '%';
    const y2p = (50 + 50 * Math.sin(rad)).toFixed(1) + '%';
    grad = svgEl('linearGradient', {id:gradId, x1:x1p, y1:y1p, x2:x2p, y2:y2p});
  } else {
    grad = svgEl('radialGradient', {id:gradId, cx:'50%', cy:'50%', r:'70%'});
  }
  const s1 = svgEl('stop', {'stop-color':color1, offset:'0%'});
  const s2 = svgEl('stop', {'stop-color':color2, offset:'100%'});
  grad.appendChild(s1); grad.appendChild(s2);
  defs.appendChild(grad);

  // Filter
  const filt = svgEl('filter', {
    id: filterId,
    filterUnits: 'objectBoundingBox',
    primitiveUnits: 'userSpaceOnUse',
    'color-interpolation-filters': 'sRGB'
  });

  const turb = svgEl('feTurbulence', {
    type: 'fractalNoise',
    baseFrequency: `${freqX} ${freqY}`,
    numOctaves: String(octaves),
    seed: String(seed),
    stitchTiles: 'stitch',
    result: 'turbulence'
  });
  filt.appendChild(turb);

  const blur = svgEl('feGaussianBlur', {
    stdDeviation: `${blurX} ${blurY}`,
    in: 'turbulence',
    edgeMode: 'duplicate',
    result: 'blur'
  });
  filt.appendChild(blur);

  const blend = svgEl('feBlend', {
    mode: mode,
    in: 'SourceGraphic',
    in2: 'blur',
    result: 'blend'
  });
  filt.appendChild(blend);

  if (saturate) {
    filt.appendChild(svgEl('feColorMatrix', {
      type: 'saturate',
      values: String(satVal),
      in: 'blend'
    }));
  }

  defs.appendChild(filt);
  svg.appendChild(defs);

  const rect = svgEl('rect', {
    x: 0, y: 0, width: W, height: H,
    fill: `url(#${gradId})`,
    filter: `url(#${filterId})`,
    opacity: String(opacity)
  });
  svg.appendChild(rect);
}

TOOLS.push({
  cat: 'Glow', slug: 'flux', name: 'Flux', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 14 Q5 10 8 14 T14 14 T18 14"/><path d="M2 10 Q5 6 8 10 T14 10 T18 10"/><path d="M2 6 Q5 2 8 6 T14 6 T18 6" opacity="0.5"/></svg>',
  desc: 'SVG filter noise — turbulence + blur + blend gradient',
  render: renderFlux,
  controls: [
    { type:'color',    id:'bgColor',   label:'Background',  default:'#000000' },
    { type:'color',    id:'color1',    label:'Color 1',     default:'hsl(200,90%,50%)' },
    { type:'color',    id:'color2',    label:'Color 2',     default:'hsl(320,80%,55%)' },
    { type:'toggle',   id:'linear',    label:'Linear grad', default:true },
    { type:'range',    id:'angle',     label:'Angle',       default:150,  min:0,     max:360,  step:1 },
    { type:'btngroup', id:'blendMode', label:'Blend mode',  default:'color-dodge',
      options:['Dodge','Burn','Hard','Saturation','Color','Overlay','Screen','Lighten','Exclusion','Soft'],
      values:['color-dodge','color-burn','hard-light','saturation','color','overlay','screen','lighten','exclusion','soft-light'] },
    { type:'range',    id:'freqX',     label:'Freq X',      default:0.005, min:0.001, max:0.02, step:0.001 },
    { type:'range',    id:'freqY',     label:'Freq Y',      default:0.003, min:0.001, max:0.02, step:0.001 },
    { type:'range',    id:'octaves',   label:'Octaves',     default:2,     min:1,     max:6,    step:1 },
    { type:'range',    id:'blurX',     label:'Blur X',      default:20,    min:0,     max:100,  step:1 },
    { type:'range',    id:'blurY',     label:'Blur Y',      default:0,     min:0,     max:100,  step:1 },
    { type:'toggle',   id:'saturate',  label:'Saturate',    default:false },
    { type:'range',    id:'satValue',  label:'Sat amount',  default:3,     min:0.5,   max:10,   step:0.5 },
    { type:'range',    id:'opacity',   label:'Opacity',     default:1,     min:0.1,   max:1,    step:0.05 },
  ],
  randomize(s, W, H) {
    s.seed = rndInt(1, 999);
  }
});
