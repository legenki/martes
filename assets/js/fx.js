// ═══════════════════════════════════════════════════════════════
// FX — post-process filters applied to a generator's output
//
// Implemented with native SVG filter primitives rather than WebGL, for
// one decisive reason: the app's whole output is SVG. getSVGString()
// serialises the <svg> DOM, so a WebGL canvas overlay is invisible to
// Copy/Save-SVG and only survives a PNG re-composite. An SVG <filter>
// travels inside the document, rasterises through the same Image() path
// doSavePNG already uses, and works headlessly in the npm package.
//
// Each effect declares its own controls; the panel builds them exactly
// like a generator's, so every one of the 34 tools gets the same section.
// ═══════════════════════════════════════════════════════════════
import { uid, toHex } from './core.js';

// `p` is the effect's parameter object; every builder returns the innerHTML
// of a <filter>, with SourceGraphic as the input.
export const FX = [
  {
    id: 'none', name: 'None', controls: [],
    build: () => null,
  },

  {
    id: 'grain', name: 'Grain',
    desc: 'Monochrome film grain over the artwork',
    controls: [
      { type:'range', id:'amount', label:'Amount',    default:0.35, min:0.05, max:1,   step:0.05 },
      { type:'range', id:'size',   label:'Grain size',default:0.65, min:0.2,  max:2,   step:0.05 },
    ],
    build: (p) => `
      <feTurbulence type="fractalNoise" baseFrequency="${p.size}" numOctaves="3" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0" result="ng"/>
      <feComponentTransfer in="ng" result="na">
        <feFuncA type="linear" slope="${p.amount}" intercept="0"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="na" mode="multiply" result="b"/>
      <feComposite in="b" in2="SourceGraphic" operator="atop"/>`,
  },

  {
    id: 'warp', name: 'Warp',
    desc: 'Turbulent displacement — liquid distortion',
    controls: [
      { type:'range', id:'strength', label:'Strength',  default:18, min:2,     max:80,  step:1 },
      { type:'range', id:'scale',    label:'Turbulence',default:0.02,min:0.002,max:0.08,step:0.002 },
      { type:'range', id:'detail',   label:'Detail',    default:3,  min:1,     max:6,   step:1 },
    ],
    build: (p) => `
      <feTurbulence type="fractalNoise" baseFrequency="${p.scale}" numOctaves="${p.detail}" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${p.strength}" xChannelSelector="R" yChannelSelector="G"/>`,
  },

  {
    id: 'halftone', name: 'Halftone',
    desc: 'Print-style dot screen over the artwork',
    controls: [
      { type:'range', id:'size',    label:'Dot size', default:4,   min:2,   max:14, step:1 },
      { type:'range', id:'mix',     label:'Mix',      default:0.6, min:0.1, max:1,  step:0.05 },
    ],
    // Built from a tiled <pattern> of dots (see `pattern` below) composited
    // over the source, rather than a turbulence mask — turbulence produced a
    // sparse random scatter that erased the artwork instead of screening it.
    pattern: (p, id) => `
      <pattern id="${id}" width="${p.size}" height="${p.size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <circle cx="${(p.size / 2).toFixed(2)}" cy="${(p.size / 2).toFixed(2)}" r="${(p.size * 0.26).toFixed(2)}" fill="#000"/>
      </pattern>`,
    patternOpacity: (p) => p.mix,
    build: () => null,
  },

  {
    id: 'dither', name: 'Dither',
    desc: 'Posterised bands with noise break-up',
    controls: [
      { type:'range', id:'levels', label:'Levels', default:4,   min:2,    max:10, step:1 },
      { type:'range', id:'noise',  label:'Noise',  default:0.5, min:0,    max:1,  step:0.05 },
    ],
    build: (p) => {
      const n = Math.max(2, Math.round(p.levels));
      const table = Array.from({length: n}, (_, i) => (i / (n - 1)).toFixed(3)).join(' ');
      return `
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="11" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0" result="ng"/>
      <feComponentTransfer in="ng" result="na">
        <feFuncA type="linear" slope="${(p.noise * 0.5).toFixed(3)}"/>
      </feComponentTransfer>
      <feComposite in="SourceGraphic" in2="na" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="mixed"/>
      <feComponentTransfer in="mixed">
        <feFuncR type="discrete" tableValues="${table}"/>
        <feFuncG type="discrete" tableValues="${table}"/>
        <feFuncB type="discrete" tableValues="${table}"/>
      </feComponentTransfer>`;
    },
  },

  {
    id: 'bloom', name: 'Bloom',
    desc: 'Soft glow bleeding out of bright areas',
    controls: [
      { type:'range', id:'radius',    label:'Radius',   default:8,   min:1,   max:30, step:1 },
      { type:'range', id:'intensity', label:'Intensity',default:1.4, min:0.2, max:3,  step:0.1 },
    ],
    build: (p) => `
      <feGaussianBlur in="SourceGraphic" stdDeviation="${p.radius}" result="blur"/>
      <feComponentTransfer in="blur" result="bright">
        <feFuncR type="linear" slope="${p.intensity}"/>
        <feFuncG type="linear" slope="${p.intensity}"/>
        <feFuncB type="linear" slope="${p.intensity}"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="bright" mode="screen"/>`,
  },

  {
    id: 'chromatic', name: 'Chromatic',
    desc: 'RGB channel split — lens fringing',
    controls: [
      { type:'range', id:'offset', label:'Offset', default:4, min:1, max:20, step:1 },
      { type:'range', id:'angle',  label:'Angle',  default:0, min:0, max:180, step:15 },
    ],
    build: (p) => {
      const rad = (p.angle * Math.PI) / 180;
      const dx = (Math.cos(rad) * p.offset).toFixed(2);
      const dy = (Math.sin(rad) * p.offset).toFixed(2);
      return `
      <feOffset in="SourceGraphic" dx="${dx}" dy="${dy}" result="ro"/>
      <feColorMatrix in="ro" type="matrix" result="r"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
      <feColorMatrix in="SourceGraphic" type="matrix" result="g"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
      <feOffset in="SourceGraphic" dx="${-dx}" dy="${-dy}" result="bo"/>
      <feColorMatrix in="bo" type="matrix" result="b"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
      <feBlend in="r" in2="g" mode="screen" result="rg"/>
      <feBlend in="rg" in2="b" mode="screen"/>`;
    },
  },

  {
    id: 'posterize', name: 'Posterize',
    desc: 'Flatten colour into hard steps',
    controls: [
      { type:'range', id:'levels', label:'Levels', default:5, min:2, max:12, step:1 },
    ],
    build: (p) => {
      const n = Math.max(2, Math.round(p.levels));
      const table = Array.from({length: n}, (_, i) => (i / (n - 1)).toFixed(3)).join(' ');
      return `
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="${table}"/>
        <feFuncG type="discrete" tableValues="${table}"/>
        <feFuncB type="discrete" tableValues="${table}"/>
      </feComponentTransfer>`;
    },
  },

  {
    id: 'blur', name: 'Blur',
    desc: 'Plain gaussian softening',
    controls: [
      { type:'range', id:'radius', label:'Radius', default:4, min:0.5, max:40, step:0.5 },
    ],
    build: (p) => `<feGaussianBlur in="SourceGraphic" stdDeviation="${p.radius}"/>`,
  },

  {
    id: 'emboss', name: 'Emboss',
    desc: 'Directional relief lighting',
    controls: [
      { type:'range', id:'depth',   label:'Depth',   default:2, min:0.5, max:8,   step:0.5 },
      { type:'range', id:'azimuth', label:'Azimuth', default:135, min:0, max:360, step:15 },
    ],
    build: (p) => `
      <feGaussianBlur in="SourceGraphic" stdDeviation="${(p.depth * 0.4).toFixed(2)}" result="s"/>
      <feSpecularLighting in="s" surfaceScale="${p.depth}" specularConstant="0.9"
                          specularExponent="18" lighting-color="#ffffff" result="sl">
        <feDistantLight azimuth="${p.azimuth}" elevation="58"/>
      </feSpecularLighting>
      <feComposite in="sl" in2="SourceAlpha" operator="in" result="slc"/>
      <feComposite in="SourceGraphic" in2="slc" operator="arithmetic"
                   k1="0" k2="1" k3="1" k4="0"/>`,
  },

  {
    id: 'duotone', name: 'Duotone',
    desc: 'Map luminance onto two colours',
    controls: [
      { type:'color', id:'shadow',    label:'Shadow',    default:'#1b2a4a' },
      { type:'color', id:'highlight', label:'Highlight', default:'#ff5c8a' },
    ],
    build: (p) => {
      const lo = hexTriplet(p.shadow, '#1b2a4a');
      const hi = hexTriplet(p.highlight, '#ff5c8a');
      return `
      <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="gray"/>
      <feComponentTransfer in="gray" result="duo">
        <feFuncR type="table" tableValues="${lo[0]} ${hi[0]}"/>
        <feFuncG type="table" tableValues="${lo[1]} ${hi[1]}"/>
        <feFuncB type="table" tableValues="${lo[2]} ${hi[2]}"/>
      </feComponentTransfer>
      <feComposite in="duo" in2="SourceAlpha" operator="in"/>`;
    },
  },

  {
    id: 'glitch', name: 'Glitch',
    desc: 'Horizontal slice displacement',
    controls: [
      { type:'range', id:'amount', label:'Amount', default:12, min:2,    max:60,  step:1 },
      { type:'range', id:'bands',  label:'Bands',  default:0.02, min:0.004, max:0.08, step:0.002 },
    ],
    // baseFrequency with a near-zero X term makes the noise vary almost
    // only along Y, so displacement lands as horizontal tears.
    build: (p) => `
      <feTurbulence type="fractalNoise" baseFrequency="0.0001 ${p.bands}" numOctaves="1" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${p.amount}" xChannelSelector="R" yChannelSelector="A"/>`,
  },

  {
    id: 'vignette', name: 'Vignette',
    desc: 'Darkened edges drawing the eye inward',
    controls: [
      { type:'range', id:'strength', label:'Strength', default:0.55, min:0.1, max:1,   step:0.05 },
      { type:'range', id:'spread',   label:'Spread',   default:0.72, min:0.3, max:0.95,step:0.02 },
    ],
    // Needs geometry, not just a filter — handled specially in applyFx().
    overlay: (p, W, H, id) => `
      <radialGradient id="${id}" cx="50%" cy="50%" r="72%">
        <stop offset="${(p.spread * 100).toFixed(0)}%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="${p.strength}"/>
      </radialGradient>`,
    build: () => null,
  },

  {
    id: 'sharpen', name: 'Sharpen',
    desc: 'Edge-enhancing convolution',
    controls: [
      { type:'range', id:'amount', label:'Amount', default:1, min:0.2, max:4, step:0.1 },
    ],
    build: (p) => {
      const a = Number(p.amount) || 1;
      const centre = (1 + 4 * a).toFixed(3);
      const side = (-a).toFixed(3);
      return `<feConvolveMatrix order="3" preserveAlpha="true"
        kernelMatrix="0 ${side} 0  ${side} ${centre} ${side}  0 ${side} 0"/>`;
    },
  },
];

export const FX_BY_ID = Object.fromEntries(FX.map(f => [f.id, f]));

// "#rrggbb" -> ["0.xx","0.xx","0.xx"] for feFunc* tableValues.
function hexTriplet(color, fallback) {
  const hex = toHex(color, fallback);
  return [1, 3, 5].map(i => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3));
}

// Resolve an effect's parameters from state, filling defaults.
export function fxParams(effect, s) {
  const p = {};
  for (const c of effect.controls) {
    const key = '_fx_' + effect.id + '_' + c.id;
    p[c.id] = s[key] !== undefined ? s[key] : c.default;
  }
  return p;
}

// Wrap everything already rendered into `svg` in the selected effect.
// Called after the generator has drawn, so it post-processes the result.
export function applyFx(svg, W, H, s) {
  const effect = FX_BY_ID[s._fx];
  if (!effect || effect.id === 'none') return;

  const NS = 'http://www.w3.org/2000/svg';
  const p = fxParams(effect, s);

  // Move the generator's output into a group we can filter as a unit.
  // <defs> stays put: filters/gradients must remain resolvable.
  const defs = svg.querySelector('defs');
  const group = document.createElementNS(NS, 'g');
  for (const node of [...svg.childNodes]) {
    if (node === defs) continue;
    group.appendChild(node);
  }
  svg.appendChild(group);

  const body = effect.build(p);
  if (body) {
    const filterId = uid('fx');
    const filter = document.createElementNS(NS, 'filter');
    filter.setAttribute('id', filterId);
    // Room for blur/offset to bleed without clipping at the edges.
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.innerHTML = body;
    (defs || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild))
      .appendChild(filter);
    group.setAttribute('filter', `url(#${filterId})`);
  }

  // Pattern-based screens (halftone) composite a tiled overlay clipped to
  // the artwork's own alpha, so the dots sit *on* the art, not over the page.
  if (effect.pattern) {
    const pid = uid('fxp');
    const d = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
    const holder = document.createElementNS(NS, 'g');
    holder.innerHTML = effect.pattern(p, pid);
    while (holder.firstChild) d.appendChild(holder.firstChild);
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', 0); rect.setAttribute('y', 0);
    rect.setAttribute('width', W); rect.setAttribute('height', H);
    rect.setAttribute('fill', `url(#${pid})`);
    rect.setAttribute('opacity', effect.patternOpacity ? effect.patternOpacity(p) : 1);
    rect.setAttribute('style', 'mix-blend-mode:multiply');
    rect.setAttribute('pointer-events', 'none');
    svg.appendChild(rect);
  }

  // Effects that need real geometry on top (vignette) draw it here.
  if (effect.overlay) {
    const gid = uid('fxo');
    const d = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
    const wrap = document.createElementNS(NS, 'g');
    wrap.innerHTML = effect.overlay(p, W, H, gid);
    while (wrap.firstChild) d.appendChild(wrap.firstChild);
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', 0); rect.setAttribute('y', 0);
    rect.setAttribute('width', W); rect.setAttribute('height', H);
    rect.setAttribute('fill', `url(#${gid})`);
    rect.setAttribute('pointer-events', 'none');
    svg.appendChild(rect);
  }
}
