// ── 8. cccircular — circular gradient patterns ────────────
function renderHalo(svg, W, H, s) {
  const defs = svgEl('defs');
  svg.appendChild(defs);

  const bg = svgEl('rect',{x:0,y:0,width:W,height:H,fill:s.bgColor});
  svg.appendChild(bg);

  const cx = W/2, cy = H/2;
  const maxR = Math.sqrt(cx*cx + cy*cy) * 1.1;
  const rings = s.rings;

  for (let i = rings; i >= 1; i--) {
    const t = i / rings;
    const r = maxR * t;
    const color = lerpColor(s.color1, s.color2, 1 - t);
    const gradId = uid('cg-' + i);

    const grad = svgEl('radialGradient', {id:gradId,cx:'50%',cy:'50%',r:'50%'});
    const s1 = svgEl('stop', {'stop-color':color,'stop-opacity':'1',offset:'0%'});
    const s2 = svgEl('stop', {'stop-color':color,'stop-opacity':'0',offset:'100%'});
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);

    const circle = svgEl('circle', {cx,cy,r,fill:`url(#${gradId})`,opacity:s.opacity});
    svg.appendChild(circle);
  }
}

TOOLS.push({
  cat: 'Form', slug: 'halo', name: 'Halo', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="4"/><path d="M10 1 L10 4 M10 16 L10 19 M1 10 L4 10 M16 10 L19 10"/></svg>',
  desc: 'Radial gradient circle layers',
  render: renderHalo,
  controls: [
    { type:'color', id:'bgColor', label:'Background', default:'#0a0a0a' },
    { type:'color', id:'color1',  label:'Inner color', default:'#7b2fff' },
    { type:'color', id:'color2',  label:'Outer color', default:'#ff2d55' },
    { type:'range', id:'rings',   label:'Rings',   default:8,   min:2, max:20,  step:1 },
    { type:'range', id:'opacity', label:'Opacity', default:0.7, min:0.1,max:1,  step:0.05 },
  ]
});
