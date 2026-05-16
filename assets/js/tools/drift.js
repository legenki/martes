// ── 14. ffflurry — diagonal pill-shaped streaks ───────────────
function renderDrift(svg, W, H, s) {
  const defs = svgEl('defs');
  const gradId = uid('flurry-grad');
  const grad = svgEl('linearGradient', {id:gradId, x1:'0%', y1:'100%', x2:'0%', y2:'0%'});
  const st1 = svgEl('stop', {'stop-color':s.bgColor,  'stop-opacity':'1', offset:'0%'});
  const st2 = svgEl('stop', {'stop-color':s.color1,   'stop-opacity':'1', offset:'50%'});
  const st3 = svgEl('stop', {'stop-color':s.color2,   'stop-opacity':'1', offset:'100%'});
  grad.appendChild(st1); grad.appendChild(st2); grad.appendChild(st3);
  defs.appendChild(grad);
  svg.appendChild(defs);

  const bg = svgEl('rect', {x:0,y:0,width:W,height:H,fill:s.bgColor});
  svg.appendChild(bg);

  const angle = s.angle;
  for (let i = 0; i < s.count; i++) {
    const w = rnd(s.multiplier * 10, s.multiplier * 35);
    const h = s.thickness;
    const cx = rnd(-W*0.1, W*1.1);
    const cy = rnd(-H*0.1, H*1.1);
    const opacity = rnd(0.07, 0.97);
    const rect = svgEl('rect', {
      x: cx - w/2, y: cy - h/2,
      width: w, height: h,
      rx: h/2,
      fill: `url(#${gradId})`,
      opacity,
      transform: `rotate(${angle} ${cx} ${cy})`
    });
    svg.appendChild(rect);
  }
}

TOOLS.push({
  cat: 'Flow', slug: 'drift', name: 'Drift', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14 L8 5 M7 17 L12 8 M11 17 L16 8 M15 14 L17 11"/></svg>',
  desc: 'Diagonal speed-streak pill shapes',
  render: renderDrift,
  controls: [
    { type:'color', id:'bgColor',   label:'Background', default:'#0a0a2e' },
    { type:'color', id:'color1',    label:'Color 1',    default:'#3a86ff' },
    { type:'color', id:'color2',    label:'Color 2',    default:'#ff006e' },
    { type:'range', id:'count',     label:'Count',      default:77,  min:10,  max:200, step:1 },
    { type:'range', id:'angle',     label:'Angle',      default:45,  min:0,   max:360, step:1 },
    { type:'range', id:'thickness', label:'Thickness',  default:3,   min:1,   max:14,  step:1 },
    { type:'range', id:'multiplier',label:'Length',     default:15,  min:1,   max:33,  step:1 },
  ]
});
