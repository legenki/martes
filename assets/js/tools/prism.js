// ── 16. rrrainbow — uniform rainbow circles via Voronoi ────────
function renderPrism(svg, W, H, s) {
  svg.appendChild(svgEl('rect', {x:0,y:0,width:W,height:H,fill:s.bgColor}));

  // Uniform placement: each circle in its own Voronoi cell
  const cells = buildUniformVoronoi(W, H, s.count, W/2, H/2, 0);
  const prob = (s.probability ?? 100) / 100;

  cells.forEach((cell, i) => {
    // Probability: skip some cells
    if (Math.random() > prob) return;

    // Radius: cell.r * sizeFactor
    const sizeFactor = rnd(s.minFill, s.maxFill);
    const r = clamp(cell.r * sizeFactor, 1, cell.r);

    // Hue mapped linearly across cells
    const hue = s.hue1 + (i / cells.length) * (s.hue2 - s.hue1);
    const opacity = s.modOpacity ? rnd(0.1, 1.0) : 1.0;
    const color = `hsl(${hue},${s.saturation}%,${s.lightness}%)`;

    const ft = s.fillType || 'solid';
    // 'mixture': randomly solid or outline
    const isOutline = ft === 'outline' || (ft === 'mixture' && Math.random() > 0.5);

    svg.appendChild(svgEl('circle', {
      cx: cell.cx.toFixed(1), cy: cell.cy.toFixed(1), r: r.toFixed(1),
      fill:           isOutline ? 'none' : color,
      stroke:         isOutline ? color  : 'none',
      'stroke-width': isOutline ? (r * 0.12).toFixed(1) : 0,
      opacity
    }));
  });
}

TOOLS.push({
  cat: 'Weave', slug: 'prism', name: 'Prism', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 L17 16 L3 16 Z"/><path d="M10 8 L10 14"/></svg>',
  desc: 'Uniform rainbow circles, no overlap',
  render: renderPrism,
  controls: [
    { type:'color',    id:'bgColor',    label:'Background',  default:'#ffffff' },
    { type:'btngroup', id:'fillType',   label:'Fill type',   default:'solid', options:['Solid','Outline','Mix'], values:['solid','outline','mixture'] },
    { type:'range',    id:'hue1',       label:'Hue from',    default:0,   min:0,   max:360,  step:1 },
    { type:'range',    id:'hue2',       label:'Hue to',      default:360, min:0,   max:360,  step:1 },
    { type:'range',    id:'saturation', label:'Saturation',  default:75,  min:0,   max:100,  step:1 },
    { type:'range',    id:'lightness',  label:'Lightness',   default:70,  min:0,   max:100,  step:1 },
    { type:'range',    id:'count',      label:'Count',       default:333, min:10,  max:600,  step:5 },
    { type:'range',    id:'probability',label:'Probability', default:100, min:0,   max:100,  step:1 },
    { type:'toggle',   id:'modOpacity', label:'Vary opacity',default:true },
    { type:'range',    id:'minFill',    label:'Min fill',    default:0.4, min:0.1, max:1.0,  step:0.05 },
    { type:'range',    id:'maxFill',    label:'Max fill',    default:0.92,min:0.3, max:1.0,  step:0.05 },
  ]
});
