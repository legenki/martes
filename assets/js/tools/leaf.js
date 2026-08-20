// ── 18. llleaves — quarter-circle leaf, Voronoi + noise ──
// Leaf shape: M0 0h50c28 0 50 22 50 50H50C22 50 0 28 0 0Z (100×100 bbox)
// Voronoi tessellation places leaves; noise grid drives rotation/scale/opacity.
// fillType: 'solid' | 'mixture' | 'stroke'
// Blur tiers: scaleValue<0.2→stdDev12, <0.3→4, <0.4→2
import { map, svgEl, uid, random } from '../core.js';
import { buildUniformVoronoi } from './_voronoi.js';

const LL_LEAF_D = 'M0 0h50c28 0 50 22 50 50H50C22 50 0 28 0 0Z';

function renderLeaf(svg, W, H, s) {


  const color     = s.color       || 'hsl(305,77%,40%)';
  const fillType  = s.fillType    || 'mixture';
  const freq      = s.density     || 65;     // Voronoi seed count
  const prob      = (s.probability ?? 100) / 100;
  const regularity= s.regularity  ?? 0.0125;
  const doBlur    = s.blur        ?? true;
  const doOpacity = s.modOpacity  ?? true;

  let markup = `<rect x="0" y="0" width="${W}" height="${H}" fill="${s.bgColor}"/>`;
  
  // Blur filters
  // Per-render id prefix — hardcoded ids collided when an earlier render's
  // <defs> was still in the document, silently re-pointing url(#…) references.
  const blurId = uid('ll-blur');
  markup += `<defs>`;
  if (doBlur) {
    [[2,2],[3,4],[4,12]].forEach(([id, sd]) => {
      markup += `<filter id="${blurId}-${id}" x="-100%" y="-100%" width="400%" height="400%">`;
      markup += `<feGaussianBlur in="SourceGraphic" stdDeviation="${sd}"/>`;
      markup += `</filter>`;
    });
  }
  markup += `</defs>`;
  
  let fillMarkup = '';
  let strokeMarkup = '';

  // Lightweight Voronoi via Lloyd relaxation (uniform point distribution)
  const cells = buildUniformVoronoi(W, H, freq, W/2, H/2, 0);

  // Simple smooth noise for coherent angle/scale field
  // Using value noise seeded per render
  const seed = random() * 1000;
  function smoothNoise(x, y) {
    const nx = x * regularity * 80 + seed;
    const ny = y * regularity * 80 + seed * 1.618;
    const n = Math.sin(nx * 127.1 + ny * 311.7) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // [-1, 1]
  }

  cells.forEach(cell => {
    if (random() > prob) return;

    const cx = Math.round(cell.cx);
    const cy = Math.round(cell.cy);
    const nv = smoothNoise(cx, cy); // -1..1

    const rotation  = Math.round(map(nv, -1, 1, 0, 360));
    const scaleVal  = map(nv, -1, 1, 0.1, 0.65);
    const opacityVal= map(nv, -1, 1, 0.15, 1);

    // Pick group
    const isStroke = (fillType === 'stroke') || (fillType === 'mixture' && random() > 0.55);

    const size = 100 * scaleVal;
    const half = size / 2;
    const tx = cx - half;
    const ty = cy - half;

    let filterAttr = '';
    if (doBlur) {
      if      (scaleVal < 0.2) filterAttr = `filter="url(#${blurId}-4)"`;
      else if (scaleVal < 0.3) filterAttr = `filter="url(#${blurId}-3)"`;
      else if (scaleVal < 0.4) filterAttr = `filter="url(#${blurId}-2)"`;
    }
    
    const opacAttr = doOpacity ? `opacity="${opacityVal.toFixed(2)}"` : '';
    const transform = `rotate(${rotation} ${cx} ${cy}) translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scaleVal.toFixed(4)})`;

    const pathStr = `<path d="${LL_LEAF_D}" transform="${transform}" ${opacAttr} ${filterAttr} />`;
    if (isStroke) strokeMarkup += pathStr;
    else          fillMarkup += pathStr;
  });

  if (fillType !== 'stroke') markup += `<g fill="${color}">${fillMarkup}</g>`;
  if (fillType !== 'solid')  markup += `<g fill="none" stroke="${color}" stroke-width="3">${strokeMarkup}</g>`;
  
  svg.innerHTML = markup;
}

export default {
  cat: 'Form', slug: 'leaf', name: 'Leaf', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16 Q4 4 16 4 Q16 16 4 16 Z"/><path d="M4 16 L10 10"/></svg>',
  desc: 'Organic leaf & petal grid pattern',
  render: renderLeaf,
  controls: [
    { type:'color',    id:'bgColor',     label:'Background', default:'#fdf6ec' },
    { type:'color',    id:'color',       label:'Leaf color', default:'#c026d3' },
    { type:'btngroup', id:'fillType',    label:'Fill',       default:'mixture',
      options:['Solid','Stroke','Mix'], values:['solid','stroke','mixture'] },
    { type:'range',    id:'density',     label:'Density',    default:65,     min:22,  max:155,  step:1 },
    { type:'range',    id:'probability', label:'Coverage',   default:100,    min:15,  max:100,  step:1 },
    { type:'range',    id:'regularity',  label:'Regularity', default:0.0125, min:0.002, max:0.08, step:0.001 },
    { type:'toggle',   id:'blur',        label:'Blur',       default:true },
    { type:'toggle',   id:'modOpacity',  label:'Vary opacity', default:true },
  ]
}
