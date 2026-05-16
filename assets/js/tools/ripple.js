// ── 12. sssquiggly — squiggly background lines ──────────
function renderRipple(svg, W, H, s) {
  const bg = svgEl('rect',{x:0,y:0,width:W,height:H,fill:s.bgColor});
  svg.appendChild(bg);

  const lines = s.lineCount;
  const amp = s.amplitude;
  const freq = s.frequency;
  const sw = s.strokeWidth;
  const segLen = s.segmentLength;

  for (let i = 0; i < lines; i++) {
    const t = i / (lines - 1);
    const y = lerp(H * 0.05, H * 0.95, t);
    const color = lerpColor(s.color1, s.color2, t);
    const phase = rnd(0, Math.PI);

    let d = `M 0 ${y}`;
    let x = 0;
    while (x < W) {
      const cp1x = x + segLen * 0.3;
      const cp1y = y + (Math.random() > 0.5 ? amp : -amp);
      const cp2x = x + segLen * 0.7;
      const cp2y = y + (Math.random() > 0.5 ? amp : -amp);
      x += segLen;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`;
    }

    const path = svgEl('path', {d, fill:'none', stroke:color, 'stroke-width':sw, 'stroke-linecap':'round'});
    svg.appendChild(path);
  }
}

TOOLS.push({
  cat: 'Flow', slug: 'ripple', name: 'Ripple', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6 Q6 3 10 6 T18 6"/><path d="M2 10 Q6 7 10 10 T18 10"/><path d="M2 14 Q6 11 10 14 T18 14"/></svg>',
  desc: 'Squiggly flowing line background',
  render: renderRipple,
  controls: [
    { type:'color', id:'bgColor',      label:'Background', default:'#0a0a1a' },
    { type:'color', id:'color1',       label:'Color 1',    default:'#7b2fff' },
    { type:'color', id:'color2',       label:'Color 2',    default:'#00c8ff' },
    { type:'range', id:'lineCount',    label:'Lines',      default:30, min:5,  max:100, step:1 },
    { type:'range', id:'amplitude',    label:'Amplitude',  default:15, min:2,  max:80,  step:1 },
    { type:'range', id:'segmentLength',label:'Wiggle',     default:60, min:10, max:200, step:5 },
    { type:'range', id:'strokeWidth',  label:'Stroke',     default:2,  min:0.5,max:10,  step:0.5 },
  ]
});
