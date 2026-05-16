// ── 1. ttten — 10-Print diagonal lines ──────────────────────
function renderSlash(svg, W, H, s) {
  const blockSize = s.blockSize;
  const strokeWidth = s.strokeWidth;
  const probability = s.probability;
  const color = s.color;
  const lineCap = s.lineCap;
  const opacityMode = s.opacityMode;
  const opacity = s.opacity;
  const cols = Math.ceil(W / blockSize) + 1;
  const rows = Math.ceil(H / blockSize) + 1;

  const bg = svgEl('rect', { x:0, y:0, width:W, height:H, fill: s.bgColor });
  svg.appendChild(bg);

  const defs = svgEl('defs');
  svg.appendChild(defs);

  const g = svgEl('g', { stroke: color, 'stroke-width': strokeWidth, 'stroke-linecap': lineCap });
  svg.appendChild(g);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * blockSize;
      const y = row * blockSize;
      const diag = Math.random() > probability;

      let lineOpacity = opacity;
      if (opacityMode === 'fade') lineOpacity = opacity * map(row, 0, rows-1, 1, 0.05);
      else if (opacityMode === 'fade-in') lineOpacity = opacity * map(row, 0, rows-1, 0.05, 1);
      else if (opacityMode === 'fade-left') lineOpacity = opacity * map(col, 0, cols-1, 1, 0.05);
      else if (opacityMode === 'fade-right') lineOpacity = opacity * map(col, 0, cols-1, 0.05, 1);
      else if (opacityMode === 'random') lineOpacity = opacity * rnd(0.05, 1);

      const line = diag
        ? svgEl('line', { x1:x, y1:y, x2:x+blockSize, y2:y+blockSize, opacity: lineOpacity })
        : svgEl('line', { x1:x+blockSize, y1:y, x2:x, y2:y+blockSize, opacity: lineOpacity });
      g.appendChild(line);
    }
  }
}

TOOLS.push({
  cat: 'Weave', slug: 'slash', name: 'Slash', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 L17 3 M3 3 L17 17"/></svg>',
  desc: '10 Print-inspired diagonal line pattern',
  render: renderSlash,
  controls: [
    { type:'color',    id:'color',       label:'Stroke color',  default:'#e83e8c' },
    { type:'color',    id:'bgColor',     label:'Background',    default:'#ffffff' },
    { type:'btngroup', id:'lineCap',     label:'Line caps',     default:'butt',    options:['butt','square','round'] },
    { type:'btngroup', id:'opacityMode', label:'Opacity mode',  default:'fade',    options:['fade ↓','fade ↑','fade ←','fade →','random','solid'], values:['fade','fade-in','fade-left','fade-right','random',''] },
    { type:'range',    id:'opacity',     label:'Opacity',       default:1,   min:0.05, max:1,   step:0.01 },
    { type:'range',    id:'blockSize',   label:'Block size',    default:54,  min:10,   max:200, step:2 },
    { type:'range',    id:'strokeWidth', label:'Stroke width',  default:3.5, min:0.5,  max:20,  step:0.5 },
    { type:'range',    id:'probability', label:'Probability',   default:0.5, min:0.05, max:0.95,step:0.01 },
  ]
});
