// ── 15. ssscales — fish-scale staggered circles ──
// Original: noise grid maps hue per circle; odd rows shifted left by baseSize/2.
// scalesPerRow = round(W / (baseSize/1.3))
// nbRows       = round(H / (baseSize/2.3))
// circle cx = i*baseSize, cy = j*(baseSize/2)
// odd rows group gets translate(-(baseSize/2), 0)
function renderScale(svg, W, H, s) {
  svg.appendChild(svgEl('rect', {x:0,y:0,width:W,height:H,fill:s.bgColor}));

  const baseSize  = s.circleSize  || 75;
  const hue1      = s.hue1        ?? 150;
  const hue2      = s.hue2        ?? 350;
  const sat       = s.saturation  ?? 85;
  const lit       = s.lightness   ?? 50;
  const freq      = s.noiseFreq   ?? 0.0255;

  const scalesPerRow = Math.round(W / (baseSize / 1.3));
  const nbRows       = Math.round(H / (baseSize / 2.3));
  const r = baseSize / 2;

  // Lightweight 2D smooth noise (value noise via sine, matching original's feel)
  function noiseVal(ix, iy) {
    const n = Math.sin(ix * 127.1 * freq * 80 + iy * 311.7 * freq * 80) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // map to [-1, 1]
  }

  const gEven = svgEl('g');
  const gOdd  = svgEl('g', {transform:`translate(${(-baseSize/2).toFixed(2)},0)`});
  svg.appendChild(gEven);
  svg.appendChild(gOdd);

  for (let j = 0; j < nbRows; j++) {
    const g = j % 2 === 0 ? gEven : gOdd;
    for (let i = 0; i < scalesPerRow; i++) {
      const cx = i * baseSize;
      const cy = j * (baseSize / 2);
      const nv = noiseVal(i, j);                         // -1..1
      const hue = Math.round(hue1 + (nv + 1) / 2 * (hue2 - hue1));
      g.appendChild(svgEl('circle', {
        cx, cy, r,
        fill: `hsl(${hue},${sat}%,${lit}%)`
      }));
    }
  }
}

TOOLS.push({
  cat: 'Weave', slug: 'scale', name: 'Scale', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10 A4 4 0 0 1 10 10 A4 4 0 0 1 18 10"/><path d="M2 14 A4 4 0 0 1 10 14 A4 4 0 0 1 18 14"/><path d="M2 6 A4 4 0 0 1 10 6 A4 4 0 0 1 18 6"/></svg>',
  desc: 'Fish-scale staggered circle grid',
  render: renderScale,
  controls: [
    { type:'color', id:'bgColor',     label:'Background', default:'#111' },
    { type:'range', id:'hue1',        label:'Hue from',   default:150,   min:0,      max:360,  step:1 },
    { type:'range', id:'hue2',        label:'Hue to',     default:350,   min:0,      max:360,  step:1 },
    { type:'range', id:'saturation',  label:'Saturation', default:85,    min:15,     max:100,  step:1 },
    { type:'range', id:'lightness',   label:'Lightness',  default:50,    min:15,     max:90,   step:1 },
    { type:'range', id:'circleSize',  label:'Size',       default:75,    min:25,     max:200,  step:1 },
    { type:'range', id:'noiseFreq',   label:'Variation',  default:0.0255,min:0.0055, max:0.0855,step:0.0005 },
  ]
});
